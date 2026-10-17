import { describe, expect, it } from "vitest";
import { buildApp, jsonOf, promoteToRole, registerUser } from "./test-helpers";

const ANA = { givenName: "Ana", familyName: "Rivas", email: "ana@correo.com", password: "secreto123" };

describe("Admin routes · PATCH /api/v1/admin/users/:id/role", () => {
  it("forbids non-admin roles (coordinador and aprobador)", async () => {
    const { app } = buildApp();
    const jar = await registerUser(app, ANA);
    const other = await registerUser(app, {
      givenName: "Bruno",
      familyName: "Gomez",
      email: "bruno@correo.com",
      password: "secreto123",
    });
    const response = await app.request("/api/v1/admin/users/some-id/role", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": jar.get("facy.csrf_token") ?? "",
        cookie: jar.header(),
      },
      body: JSON.stringify({ role: "admin_sistema" }),
    });
    expect(response.status).toBe(403);
    void other;
  });

  it("lets an admin change a role (204) and reflects it immediately (R14)", async () => {
    const { app, store } = buildApp();
    const jar = await registerUser(app, ANA);
    const otherJar = await registerUser(app, {
      givenName: "Bruno",
      familyName: "Gomez",
      email: "bruno@correo.com",
      password: "secreto123",
    });
    const bruno = store.userByUsername("bruno.gomez");
    expect(bruno?.role).toBe("coordinador");

    promoteToRole(store, "ana.rivas", "admin_sistema");
    const response = await app.request(`/api/v1/admin/users/${bruno?.id}/role`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": jar.get("facy.csrf_token") ?? "",
        cookie: jar.header(),
      },
      body: JSON.stringify({ role: "aprobador" }),
    });
    expect(response.status).toBe(204);
    expect(store.userByUsername("bruno.gomez")?.role).toBe("aprobador");

    // La sesión vigente de Bruno pierde/gana rol fresco desde el store.
    const session = await app.request("/api/v1/auth/session", {
      headers: { cookie: otherJar.header() },
    });
    expect((await jsonOf(session)).user).toMatchObject({ role: "aprobador" });
  });

  it("demoting an admin is effective immediately (fresh role, no stale claim)", async () => {
    const { app, store } = buildApp();
    const jar = await registerUser(app, ANA);
    const anaId = store.userByUsername("ana.rivas")?.id;
    promoteToRole(store, "ana.rivas", "admin_sistema");
    const promote = await app.request(`/api/v1/admin/users/${anaId}/role`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": jar.get("facy.csrf_token") ?? "",
        cookie: jar.header(),
      },
      body: JSON.stringify({ role: "coordinador" }),
    });
    expect(promote.status).toBe(204);

    // Con el rol ya demovido, la sesión vigente NO autoriza /admin/* (R14).
    const blocked = await app.request(`/api/v1/admin/users/${anaId}/role`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": jar.get("facy.csrf_token") ?? "",
        cookie: jar.header(),
      },
      body: JSON.stringify({ role: "admin_sistema" }),
    });
    expect(blocked.status).toBe(403);
  });

  it("returns 400 when the id fails idSchema (validationError branch)", async () => {
    const { app, store } = buildApp();
    const jar = await registerUser(app, ANA);
    promoteToRole(store, "ana.rivas", "admin_sistema");
    const longId = "a".repeat(65);
    const response = await app.request(`/api/v1/admin/users/${longId}/role`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": jar.get("facy.csrf_token") ?? "",
        cookie: jar.header(),
      },
      body: JSON.stringify({ role: "admin_sistema" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns 404 for a non-existent user id", async () => {
    const { app, store } = buildApp();
    const jar = await registerUser(app, ANA);
    promoteToRole(store, "ana.rivas", "admin_sistema");
    const response = await app.request("/api/v1/admin/users/missing-id/role", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": jar.get("facy.csrf_token") ?? "",
        cookie: jar.header(),
      },
      body: JSON.stringify({ role: "admin_sistema" }),
    });
    expect(response.status).toBe(404);
  });
});
