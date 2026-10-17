import { describe, expect, it } from "vitest";
import { sessionSchema } from "../domain/validation";
import { buildApp, CookieJar, jsonOf, obtainCsrfToken } from "./test-helpers";

const REGISTER_BODY = {
  givenName: "María",
  familyName: "Rivas",
  email: "maria@correo.com",
  password: "secreto123",
};

/**
 * Registra un usuario con CSRF (obtiene la cookie primero y la reutiliza).
 */
async function registerWithCsrf(
  app: ReturnType<typeof buildApp>["app"],
  body: Record<string, unknown>,
  options: { jar?: CookieJar; ip?: string } = {},
): Promise<{ response: Response; jar: CookieJar }> {
  const jar = options.jar ?? new CookieJar();
  if (!jar.get("facy.csrf_token")) {
    jar.capture(await app.request("/api/v1/auth/session"));
  }
  const csrf = jar.get("facy.csrf_token") ?? "";
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-csrf-token": csrf,
  };
  if (jar.header()) headers.cookie = jar.header();
  if (options.ip) headers["x-forwarded-for"] = options.ip;
  const response = await app.request("/api/v1/auth/register", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  jar.capture(response);
  return { response, jar };
}

describe("Auth routes · register", () => {
  it("registers a user, returns 201 Session wire + secure cookies", async () => {
    const { app } = buildApp();
    const { response, jar } = await registerWithCsrf(app, REGISTER_BODY);
    expect(response.status).toBe(201);

    const body = await jsonOf(response);
    expect(sessionSchema.safeParse(body).success).toBe(true);
    expect(body.user).toMatchObject({ role: "coordinador" });
    expect(body.user).not.toHaveProperty("email");

    const setCookies = response.headers.getSetCookie();
    expect(setCookies.some((c) => c.includes("HttpOnly"))).toBe(true);
    expect(setCookies.some((c) => c.includes("SameSite=Lax"))).toBe(true);
    expect(JSON.stringify(setCookies)).not.toContain(REGISTER_BODY.password);
    expect(JSON.stringify(setCookies)).not.toContain(REGISTER_BODY.email);

    expect(jar.get("better-auth.session_token")).toBeTruthy();
  });

  it("returns 400 with field details for each invalid register rule", async () => {
    const { app } = buildApp();
    const cases: Array<[Record<string, string>, string]> = [
      [{ ...REGISTER_BODY, givenName: "A" }, "givenName"],
      [{ ...REGISTER_BODY, familyName: "1" }, "familyName"],
      [{ ...REGISTER_BODY, email: "mal" }, "email"],
      [{ ...REGISTER_BODY, password: "corta" }, "password"],
      [{ ...REGISTER_BODY, password: "a".repeat(129) }, "password"],
      [{ ...REGISTER_BODY, email: "a".repeat(250) + "@x.com" }, "email"],
    ];
    for (const [payload, field] of cases) {
      const { response } = await registerWithCsrf(app, payload);
      expect(response.status, field).toBe(400);
      const body = await jsonOf(response);
      expect(body.error).toBe("validation_error");
      const details = body.details as Array<{ field: string }>;
      expect(details.some((d) => d.field === field)).toBe(true);
    }
  });

  it("returns an identical generic 409 for a duplicate email", async () => {
    const { app } = buildApp();
    await registerWithCsrf(app, REGISTER_BODY);
    const { response } = await registerWithCsrf(app, REGISTER_BODY);
    expect(response.status).toBe(409);
    expect(await jsonOf(response)).toEqual({
      error: "account_conflict",
      message: "No pudimos crear la cuenta. Intenta de nuevo.",
    });
  });

  it("derives a unique username with a numeric suffix on collision", async () => {
    const { app } = buildApp();
    const first = await registerWithCsrf(app, REGISTER_BODY);
    const second = await registerWithCsrf(app, {
      ...REGISTER_BODY,
      email: "otra@correo.com",
    });
    expect(first.response.status).toBe(201);
    expect(second.response.status).toBe(201);
    const firstBody = await jsonOf(first.response);
    const secondBody = await jsonOf(second.response);
    expect(firstBody.user).toMatchObject({ username: "maria.rivas" });
    expect(secondBody.user).toMatchObject({ username: "maria.rivas1" });
  });

  it("ignores a role sent in the register body (user is always coordinador)", async () => {
    const { app, store } = buildApp();
    const { response, jar } = await registerWithCsrf(app, {
      ...REGISTER_BODY,
      role: "admin_sistema",
    });
    expect(response.status).toBe(201);

    const session = await app.request("/api/v1/auth/session", {
      headers: { cookie: jar.header() },
    });
    expect(await jsonOf(session)).toMatchObject({
      user: { role: "coordinador" },
    });

    const stored = store.userByEmail("maria@correo.com");
    expect(stored?.role).toBe("coordinador");
  });

  it("returns 429 after N+1 registrations from the same IP", async () => {
    const { app } = buildApp({ RATE_LIMIT_MAX: "3", RATE_LIMIT_WINDOW_MS: "60000" });
    const jar = new CookieJar();
    for (let index = 0; index < 3; index += 1) {
      const { response } = await registerWithCsrf(app, {
        ...REGISTER_BODY,
        email: `usuario${index}@correo.com`,
      }, { jar, ip: "10.0.0.1" });
      expect(response.status).toBe(201);
    }
    const blocked = await registerWithCsrf(app, {
      ...REGISTER_BODY,
      email: "bloqueado@correo.com",
    }, { jar, ip: "10.0.0.1" });
    expect(blocked.response.status).toBe(429);
    expect(await jsonOf(blocked.response)).toMatchObject({
      error: "rate_limited",
    });
  });
});

describe("Auth routes · login", () => {
  async function registerUser(app: ReturnType<typeof buildApp>["app"]): Promise<CookieJar> {
    const { jar } = await registerWithCsrf(app, REGISTER_BODY);
    return jar;
  }

  it("logs in and returns 200 Session + a new cookie", async () => {
    const { app } = buildApp();
    await registerUser(app);
    const csrf = await obtainCsrfToken(app);
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf,
        cookie: `facy.csrf_token=${csrf}`,
      },
      body: JSON.stringify({ username: "maria.rivas", password: "secreto123" }),
    });
    expect(response.status).toBe(200);
    const body = await jsonOf(response);
    expect(sessionSchema.safeParse(body).success).toBe(true);
    expect(body.user).toMatchObject({ username: "maria.rivas", role: "coordinador" });
    const jar = new CookieJar();
    jar.capture(response);
    expect(jar.get("better-auth.session_token")).toBeTruthy();
  });

  it("returns the SAME 401 for unknown user and wrong password", async () => {
    const { app } = buildApp();
    await registerUser(app);
    const csrf = await obtainCsrfToken(app);
    const call = (payload: Record<string, string>) =>
      app.request("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
          cookie: `facy.csrf_token=${csrf}`,
        },
        body: JSON.stringify(payload),
      });

    const unknown = await call({ username: "nobody", password: "secreto123" });
    const wrong = await call({ username: "maria.rivas", password: "incorrecta" });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    const unknownBody = await jsonOf(unknown);
    const wrongBody = await jsonOf(wrong);
    expect(unknownBody).toEqual(wrongBody);
    expect(unknownBody).toEqual({
      error: "invalid_credentials",
      message: "El usuario o la contraseña no coinciden.",
    });
  });

  it("returns 429 after N+1 failed logins per IP", async () => {
    const { app } = buildApp({ RATE_LIMIT_MAX: "3", RATE_LIMIT_WINDOW_MS: "60000" });
    await registerUser(app);
    const csrf = await obtainCsrfToken(app);
    for (let index = 0; index < 3; index += 1) {
      const response = await app.request("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
          cookie: `facy.csrf_token=${csrf}`,
          "x-forwarded-for": "10.0.0.9",
        },
        body: JSON.stringify({ username: "maria.rivas", password: "mal" }),
      });
      expect(response.status).toBe(401);
    }
    const blocked = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf,
        cookie: `facy.csrf_token=${csrf}`,
        "x-forwarded-for": "10.0.0.9",
      },
      body: JSON.stringify({ username: "maria.rivas", password: "secreto123" }),
    });
    expect(blocked.status).toBe(429);
  });
});

describe("Auth routes · session and logout", () => {
  it("returns 200 Session with a valid cookie and 401 without", async () => {
    const { app } = buildApp();
    const noCookie = await app.request("/api/v1/auth/session");
    expect(noCookie.status).toBe(401);

    const { jar } = await registerWithCsrf(app, REGISTER_BODY);
    const withCookie = await app.request("/api/v1/auth/session", {
      headers: { cookie: jar.header() },
    });
    expect(withCookie.status).toBe(200);
    expect(await jsonOf(withCookie)).toMatchObject({
      user: { username: "maria.rivas", role: "coordinador" },
    });
  });

  it("logout returns 204, expires the cookie and invalidates the session", async () => {
    const { app } = buildApp();
    const { jar } = await registerWithCsrf(app, REGISTER_BODY);
    const csrf = jar.get("facy.csrf_token") ?? "";

    const logout = await app.request("/api/v1/auth/logout", {
      method: "POST",
      headers: {
        "x-csrf-token": csrf,
        cookie: jar.header(),
      },
    });
    expect(logout.status).toBe(204);

    const sessionAfter = await app.request("/api/v1/auth/session", {
      headers: { cookie: jar.header() },
    });
    expect(sessionAfter.status).toBe(401);
  });

  it("returns 401 for a session cookie signed with another secret", async () => {
    const { app, store } = buildApp();
    const { jar } = await registerWithCsrf(app, REGISTER_BODY);
    const token = jar.get("better-auth.session_token") ?? "";
    // Misma tienda, pero una app con un secreto distinto: el JWT no verifica.
    const { createApp } = await import("../app");
    const { buildTestEnv } = await import("./test-helpers");
    const otherApp = createApp({
      env: buildTestEnv({ BETTER_AUTH_SECRET: "x".repeat(40) }),
      store,
    });
    const response = await otherApp.request("/api/v1/auth/session", {
      headers: { cookie: `better-auth.session_token=${token}` },
    });
    expect(response.status).toBe(401);
  });
});

describe("Auth routes · native Better Auth routes are NOT exposed (H1)", () => {
  it("returns 404 for native sign-in/email, sign-up/email, sign-out and get-session", async () => {
    const { app } = buildApp({ RATE_LIMIT_MAX: "3", RATE_LIMIT_WINDOW_MS: "60000" });
    const targets: Array<[string, string]> = [
      ["POST", "/api/v1/auth/sign-in/email"],
      ["POST", "/api/v1/auth/sign-up/email"],
      ["POST", "/api/v1/auth/sign-out"],
      ["GET", "/api/v1/auth/get-session"],
    ];
    for (const [method, path] of targets) {
      for (let index = 0; index < 6; index += 1) {
        const response = await app.request(path, {
          method,
          headers: { "content-type": "application/json" },
          body:
            method === "GET"
              ? undefined
              : JSON.stringify({
                  email: "atacante@correo.com",
                  password: "secreto123",
                  username: "atacante",
                }),
        });
        expect(response.status, `${method} ${path} intento ${index + 1}`).toBe(
          404,
        );
      }
    }
  });

  it("a client with a valid session cannot reach native mutable routes", async () => {
    const { app } = buildApp();
    const { jar } = await registerWithCsrf(app, REGISTER_BODY);
    const csrf = jar.get("facy.csrf_token") ?? "";

    const signOut = await app.request("/api/v1/auth/sign-out", {
      method: "POST",
      headers: { "x-csrf-token": csrf, cookie: jar.header() },
    });
    expect(signOut.status).toBe(404);

    const signUp = await app.request("/api/v1/auth/sign-up/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf,
        cookie: jar.header(),
      },
      body: JSON.stringify(REGISTER_BODY),
    });
    expect(signUp.status).toBe(404);
  });
});

describe("Auth routes · register hardening", () => {
  it("clamps a derived username longer than 50 to the wire contract (QA-2)", async () => {
    const { app } = buildApp();
    const { response } = await registerWithCsrf(app, {
      givenName: "X".repeat(60),
      familyName: "Y".repeat(60),
      email: "clamp@correo.com",
      password: "secreto123",
    });
    expect(response.status).toBe(201);
    const body = await jsonOf(response);
    const username = (body.user as { username: string }).username;
    expect(username.length).toBeLessThanOrEqual(50);
    expect(username).toMatch(/^[a-z0-9._-]+$/);
  });
});

describe("Auth routes · cookie attributes and session expiry (QA-3)", () => {
  it("sets Secure cookies when NODE_ENV=production", async () => {
    const { app } = buildApp({
      NODE_ENV: "production",
      CORS_ORIGINS: "http://localhost:3000",
    });
    const { response } = await registerWithCsrf(app, REGISTER_BODY);
    expect(response.status).toBe(201);
    const cookies = response.headers.getSetCookie();
    expect(cookies.some((c) => c.includes("Secure"))).toBe(true);
    expect(cookies.some((c) => c.includes("HttpOnly"))).toBe(true);
  });

  it("returns 401 for an expired session token", async () => {
    const { app, store } = buildApp();
    const { jar } = await registerWithCsrf(app, REGISTER_BODY);
    const sessions = store.authCollection("session");
    for (const session of sessions.values()) {
      (session as { expiresAt: Date }).expiresAt = new Date(
        Date.now() - 60_000,
      );
    }
    const response = await app.request("/api/v1/auth/session", {
      headers: { cookie: jar.header() },
    });
    expect(response.status).toBe(401);
  });
});

describe("Auth routes · login rate limit counts only failures (H2)", () => {
  it("does not consume the limit on successful logins", async () => {
    const { app } = buildApp({ RATE_LIMIT_MAX: "3", RATE_LIMIT_WINDOW_MS: "60000" });
    await registerWithCsrf(app, REGISTER_BODY);
    for (let index = 0; index < 4; index += 1) {
      const csrf = await obtainCsrfToken(app);
      const response = await app.request("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
          cookie: `facy.csrf_token=${csrf}`,
          "x-forwarded-for": "10.20.30.40",
        },
        body: JSON.stringify({ username: "maria.rivas", password: "secreto123" }),
      });
      expect(response.status, `login ${index + 1}`).toBe(200);
    }
  });
});

describe("Auth routes · CSRF", () => {
  it("rejects a mutation with a trusted Origin but no x-csrf-token", async () => {
    const { app } = buildApp();
    const csrf = await obtainCsrfToken(app);
    const response = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        cookie: `facy.csrf_token=${csrf}`,
      },
      body: JSON.stringify(REGISTER_BODY),
    });
    expect(response.status).toBe(403);
  });

  it("rejects a mutation with an Origin outside the whitelist", async () => {
    const { app } = buildApp();
    const csrf = await obtainCsrfToken(app);
    const response = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example",
        "x-csrf-token": csrf,
        cookie: `facy.csrf_token=${csrf}`,
      },
      body: JSON.stringify(REGISTER_BODY),
    });
    expect(response.status).toBe(403);
  });

  it("rejects a mutation with a mismatched csrf token", async () => {
    const { app } = buildApp();
    const csrf = await obtainCsrfToken(app);
    const response = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-csrf-token": "attacker-token",
        cookie: `facy.csrf_token=${csrf}`,
      },
      body: JSON.stringify(REGISTER_BODY),
    });
    expect(response.status).toBe(403);
  });
});