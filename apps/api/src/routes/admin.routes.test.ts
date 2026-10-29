import { pino } from "pino";
import type { DestinationStream } from "pino";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";
import { MemoryUserStore } from "../infrastructure/repositories/in-memory/user-store";
import {
  buildApp,
  buildTestEnv,
  jsonOf,
  promoteToRole,
  registerUser,
} from "./test-helpers";

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

  it("rejects demoting an admin_sistema (409) and keeps the role", async () => {
    const { app, store } = buildApp();
    const jar = await registerUser(app, ANA);
    const anaId = store.userByUsername("ana.rivas")?.id;
    promoteToRole(store, "ana.rivas", "admin_sistema");
    const response = await app.request(`/api/v1/admin/users/${anaId}/role`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": jar.get("facy.csrf_token") ?? "",
        cookie: jar.header(),
      },
      body: JSON.stringify({ role: "coordinador" }),
    });
    expect(response.status).toBe(409);
    expect((await jsonOf(response)).error).toBe("immutable_role");
    expect(store.userByUsername("ana.rivas")?.role).toBe("admin_sistema");

    // El rechazo no degrada la sesión vigente del admin (R14).
    const session = await app.request("/api/v1/auth/session", {
      headers: { cookie: jar.header() },
    });
    expect((await jsonOf(session)).user).toMatchObject({
      role: "admin_sistema",
    });
  });

  it("rejects demoting another admin_sistema (409)", async () => {
    const { app, store } = buildApp();
    const jar = await registerUser(app, ANA);
    await registerUser(app, {
      givenName: "Bruno",
      familyName: "Gomez",
      email: "bruno@correo.com",
      password: "secreto123",
    });
    promoteToRole(store, "ana.rivas", "admin_sistema");
    promoteToRole(store, "bruno.gomez", "admin_sistema");
    const brunoId = store.userByUsername("bruno.gomez")?.id;
    const response = await app.request(`/api/v1/admin/users/${brunoId}/role`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": jar.get("facy.csrf_token") ?? "",
        cookie: jar.header(),
      },
      body: JSON.stringify({ role: "aprobador" }),
    });
    expect(response.status).toBe(409);
    expect(store.userByUsername("bruno.gomez")?.role).toBe("admin_sistema");
  });

  it("rejects promoting a user to admin_sistema (400, not a transition)", async () => {
    const { app, store } = buildApp();
    const jar = await registerUser(app, ANA);
    await registerUser(app, {
      givenName: "Bruno",
      familyName: "Gomez",
      email: "bruno@correo.com",
      password: "secreto123",
    });
    promoteToRole(store, "ana.rivas", "admin_sistema");
    const brunoId = store.userByUsername("bruno.gomez")?.id;
    const response = await app.request(`/api/v1/admin/users/${brunoId}/role`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": jar.get("facy.csrf_token") ?? "",
        cookie: jar.header(),
      },
      body: JSON.stringify({ role: "admin_sistema" }),
    });
    expect(response.status).toBe(400);
    expect(store.userByUsername("bruno.gomez")?.role).toBe("coordinador");
  });

  it("audits a role change with actor, transition and requestId, without PII (D5)", async () => {
    const lines: string[] = [];
    const logger = pino(
      { level: "warn" },
      {
        write: (line: string) => {
          lines.push(line);
        },
      } as DestinationStream,
    );
    const env = buildTestEnv();
    const store = new MemoryUserStore();
    const app = createApp({ env, store, logger });

    const jar = await registerUser(app, ANA);
    await registerUser(app, {
      givenName: "Bruno",
      familyName: "Gomez",
      email: "bruno@correo.com",
      password: "secreto123",
    });
    promoteToRole(store, "ana.rivas", "admin_sistema");
    const anaId = store.userByUsername("ana.rivas")?.id;
    const brunoId = store.userByUsername("bruno.gomez")?.id;

    const response = await app.request(`/api/v1/admin/users/${brunoId}/role`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": jar.get("facy.csrf_token") ?? "",
        cookie: jar.header(),
      },
      body: JSON.stringify({ role: "aprobador" }),
    });
    expect(response.status).toBe(204);

    const audit = lines
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .find((entry) => entry.event === "role_change");
    expect(audit).toMatchObject({
      event: "role_change",
      actorId: anaId,
      targetUserId: brunoId,
      roleBefore: "coordinador",
      roleAfter: "aprobador",
    });
    expect(typeof audit?.requestId).toBe("string");
    expect(JSON.stringify(audit)).not.toMatch(
      /ana@correo\.com|bruno@correo\.com|ana\.rivas|bruno\.gomez|secreto123/,
    );
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
      body: JSON.stringify({ role: "aprobador" }),
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
      body: JSON.stringify({ role: "aprobador" }),
    });
    expect(response.status).toBe(404);
  });
});
