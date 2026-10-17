import { describe, expect, it } from "vitest";
import { userOptionSchema, userSchema } from "../domain/validation";
import { buildApp, jsonOf, promoteToRole, registerUser } from "./test-helpers";

const ANA = { givenName: "Ana", familyName: "Rivas", email: "ana@correo.com", password: "secreto123" };
const BRUNO = { givenName: "Bruno", familyName: "Gomez", email: "bruno@correo.com", password: "secreto123" };

describe("Users routes · GET /api/v1/users/coordinadores", () => {
  it("requires a session", async () => {
    const { app } = buildApp();
    expect((await app.request("/api/v1/users/coordinadores")).status).toBe(401);
  });

  it("lists registered coordinadores without email or role", async () => {
    const { app, store } = buildApp();
    const anaJar = await registerUser(app, ANA);
    await registerUser(app, BRUNO);
    const anaId = store.userByUsername("ana.rivas")?.id ?? "u-a";
    const response = await app.request("/api/v1/users/coordinadores", {
      headers: { cookie: anaJar.header() },
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{
      id: string;
      username: string;
      fullName: string;
    }>;
    // El registro público solo crea coordinadores (R12): ambos califican.
    expect(body).toHaveLength(2);
    expect(userOptionSchema.safeParse(body[0]).success).toBe(true);
    expect(body).toContainEqual({
      id: anaId,
      username: "ana.rivas",
      fullName: "Ana Rivas",
    });
    expect(JSON.stringify(body)).not.toContain("email");
    expect(JSON.stringify(body)).not.toContain("role");
  });

  it("excludes users with another role", async () => {
    const { app, store } = buildApp();
    const anaJar = await registerUser(app, ANA);
    await registerUser(app, BRUNO);
    promoteToRole(store, "bruno.gomez", "aprobador");

    const response = await app.request("/api/v1/users/coordinadores", {
      headers: { cookie: anaJar.header() },
    });
    const body = (await response.json()) as Array<{ username: string }>;
    expect(body).toHaveLength(1);
    expect(body[0]?.username).toBe("ana.rivas");
  });
});

describe("Users routes · GET /api/v1/users/:username", () => {
  it("returns 400 when the username fails usernameSchema", async () => {
    const { app } = buildApp();
    const jar = await registerUser(app, ANA);
    const response = await app.request("/api/v1/users/INVALIDO", {
      headers: { cookie: jar.header() },
    });
    expect(response.status).toBe(400);
  });

  it("returns 404 for an unknown username (anti-enumeration)", async () => {
    const { app } = buildApp();
    const jar = await registerUser(app, ANA);
    const response = await app.request("/api/v1/users/nobody", {
      headers: { cookie: jar.header() },
    });
    expect(response.status).toBe(404);
  });

  it("redacts the email of another user to an empty string", async () => {
    const { app } = buildApp();
    const anaJar = await registerUser(app, ANA);
    await registerUser(app, BRUNO);
    const response = await app.request("/api/v1/users/bruno.gomez", {
      headers: { cookie: anaJar.header() },
    });
    expect(response.status).toBe(200);
    const body = await jsonOf(response);
    const profile = body.user as { email: string };
    expect(profile.email).toBe("");
    expect(JSON.stringify(body)).not.toContain("bruno@correo.com");
  });

  it("shows the full email for the own profile and for admin", async () => {
    const { app, store } = buildApp();
    const anaJar = await registerUser(app, ANA);
    await registerUser(app, BRUNO);

    const own = await app.request("/api/v1/users/ana.rivas", {
      headers: { cookie: anaJar.header() },
    });
    const ownBody = await jsonOf(own);
    expect(userSchema.safeParse(ownBody.user).success).toBe(true);
    expect(ownBody.user).toMatchObject({ email: "ana@correo.com" });

    promoteToRole(store, "ana.rivas", "admin_sistema");
    const asAdmin = await app.request("/api/v1/users/bruno.gomez", {
      headers: { cookie: anaJar.header() },
    });
    expect((await jsonOf(asAdmin)).user).toMatchObject({
      email: "bruno@correo.com",
    });
  });
});
