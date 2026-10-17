import { describe, expect, it } from "vitest";
import { buildApp } from "./test-helpers";

describe("OpenAPI routes", () => {
  it("serves /api/v1/openapi.json with wire forms and no secrets in dev", async () => {
    const { app } = buildApp();
    const response = await app.request("/api/v1/openapi.json");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");

    const text = await response.text();
    const doc = JSON.parse(text);
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info.title).toBe("Red FaCyT API");
    expect(doc.components.securitySchemes.sessionCookie.name).toBe(
      "better-auth.session_token",
    );
    expect(doc.components.securitySchemes.csrfHeader.name).toBe(
      "x-csrf-token",
    );

    // R17: sin secretos ni datos internos.
    expect(text).not.toMatch(/secret/i);
    expect(text).not.toMatch(/BETTER_AUTH|CORS_ORIGINS|DATABASE_URL/);
    expect(text).not.toContain("src/");
    expect(text).not.toContain("test-secret");
  });

  it("serves the /api/v1/docs page in dev", async () => {
    const { app } = buildApp();
    const response = await app.request("/api/v1/docs");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain("Red FaCyT API");
  });

  it("blocks openapi.json and docs in production (R17)", async () => {
    const { app } = buildApp({
      NODE_ENV: "production",
      CORS_ORIGINS: "http://localhost:3000",
    });
    expect((await app.request("/api/v1/openapi.json")).status).toBe(404);
    expect((await app.request("/api/v1/docs")).status).toBe(404);
  });

  it("blocks openapi.json and docs when OPENAPI_ENABLED=false", async () => {
    const { app } = buildApp({ OPENAPI_ENABLED: "false" });
    expect((await app.request("/api/v1/openapi.json")).status).toBe(404);
    expect((await app.request("/api/v1/docs")).status).toBe(404);
  });

  it("documents mutation security as one ANDed requirement (session + csrf)", async () => {
    const { app } = buildApp();
    const doc = (await (
      await app.request("/api/v1/openapi.json")
    ).json()) as {
      paths: Record<string, { post?: { security?: unknown } }>;
    };
    const logout = doc.paths["/api/v1/auth/logout"]?.post;
    expect(logout?.security).toEqual([
      { sessionCookie: [], csrfHeader: [] },
    ]);
  });

  it("does not expose the environment name on the docs page", async () => {
    const { app } = buildApp();
    const html = await (await app.request("/api/v1/docs")).text();
    expect(html).not.toContain("Entorno:");
    expect(html).not.toContain("NODE_ENV");
  });
});