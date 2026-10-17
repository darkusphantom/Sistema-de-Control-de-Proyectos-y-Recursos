import { describe, expect, it } from "vitest";
import type { StoredUser } from "./user-store";
import { MemoryUserStore } from "./user-store";
import { InMemoryUserRepository } from "./in-memory-user-repository";

/**
 * Crea un usuario almacenado con la forma que persiste Better Auth.
 */
function makeStoredUser(overrides: Partial<StoredUser> = {}): StoredUser {
  return {
    id: "u-1",
    email: "ana@correo.com",
    emailVerified: false,
    name: "Ana Rivas",
    image: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    username: "a.rivas",
    givenName: "Ana",
    familyName: "Rivas",
    role: "coordinador",
    ...overrides,
  };
}

describe("InMemoryUserRepository", () => {
  it("findById returns the user in wire form or null", async () => {
    const store = new MemoryUserStore();
    store.saveUser(makeStoredUser());
    const repo = new InMemoryUserRepository(store);

    const user = await repo.findById("u-1");
    expect(user).toEqual({
      id: "u-1",
      username: "a.rivas",
      email: "ana@correo.com",
      givenName: "Ana",
      familyName: "Rivas",
      role: "coordinador",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(await repo.findById("missing")).toBeNull();
  });

  it("findByUsername is case-insensitive and returns null when absent", async () => {
    const store = new MemoryUserStore();
    store.saveUser(makeStoredUser());
    const repo = new InMemoryUserRepository(store);

    expect((await repo.findByUsername("A.RIVAS"))?.id).toBe("u-1");
    expect(await repo.findByUsername("nobody")).toBeNull();
  });

  it("findByEmail is case-insensitive and returns null when absent", async () => {
    const store = new MemoryUserStore();
    store.saveUser(makeStoredUser());
    const repo = new InMemoryUserRepository(store);

    expect((await repo.findByEmail("ANA@Correo.com"))?.id).toBe("u-1");
    expect(await repo.findByEmail("missing@correo.com")).toBeNull();
  });

  it("updateRole changes the stored role immediately and returns the user", async () => {
    const store = new MemoryUserStore();
    store.saveUser(makeStoredUser());
    const repo = new InMemoryUserRepository(store);

    const updated = await repo.updateRole("u-1", "admin_sistema");
    expect(updated?.role).toBe("admin_sistema");
    expect((await repo.findById("u-1"))?.role).toBe("admin_sistema");
    expect(await repo.updateRole("missing", "admin_sistema")).toBeNull();
  });

  it("listByRole returns only the users with the requested role", async () => {
    const store = new MemoryUserStore();
    store.saveUser(makeStoredUser({ id: "u-1", username: "a.rivas", givenName: "Ana", familyName: "Rivas", role: "coordinador" }));
    store.saveUser(makeStoredUser({ id: "u-2", username: "b.gomez", email: "b@correo.com", givenName: "Bruno", familyName: "Gomez", role: "aprobador" }));
    store.saveUser(makeStoredUser({ id: "u-3", username: "c.barrios", email: "c@correo.com", givenName: "Carla", familyName: "Barrios", role: "coordinador" }));
    const repo = new InMemoryUserRepository(store);

    const coordinadores = await repo.listByRole("coordinador");
    expect(coordinadores).toHaveLength(2);
    expect(coordinadores).toContainEqual({ id: "u-1", username: "a.rivas", fullName: "Ana Rivas" });
    expect((await repo.listByRole("aprobador"))).toHaveLength(1);
    expect(await repo.listByRole("admin_sistema")).toHaveLength(0);
  });

  it("listByRole sorts by fullName using the es locale", async () => {
    const store = new MemoryUserStore();
    store.saveUser(makeStoredUser({ id: "u-1", username: "a.rivas", givenName: "Ana", familyName: "Rivas" }));
    store.saveUser(makeStoredUser({ id: "u-2", username: "z.avila", email: "z@correo.com", givenName: "Zulay", familyName: "Avila" }));
    store.saveUser(makeStoredUser({ id: "u-3", username: "c.barrios", email: "c@correo.com", givenName: "Carla", familyName: "Barrios" }));
    const repo = new InMemoryUserRepository(store);

    const names = (await repo.listByRole("coordinador")).map((a) => a.fullName);
    expect(names).toEqual(["Ana Rivas", "Carla Barrios", "Zulay Avila"]);
  });

  it("listByRole never includes email or role fields", async () => {
    const store = new MemoryUserStore();
    store.saveUser(makeStoredUser());
    const repo = new InMemoryUserRepository(store);

    const options = await repo.listByRole("coordinador");
    expect(options[0]).not.toHaveProperty("email");
    expect(options[0]).not.toHaveProperty("role");
    expect(Object.keys(options[0]).sort()).toEqual(["fullName", "id", "username"]);
  });
});