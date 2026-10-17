import { describe, expect, it } from "vitest";
import { MemoryUserStore } from "../repositories/in-memory/user-store";
import { memoryAdapter } from "./memory-auth-adapter";

/**
 * Crea el adaptador de datos de Better Auth listo para operar.
 *
 * La fábrica transforma los datos según el esquema de opciones; se pasa la
 * misma config de `additionalFields` que `createAuth` para que `username`,
 * `givenName`, `familyName` y `role` se conserven.
 */
function buildAdapter() {
  const store = new MemoryUserStore();
  const db = memoryAdapter(store)({
    user: {
      additionalFields: {
        username: { type: "string", required: true, input: true },
        givenName: { type: "string", required: true, input: true },
        familyName: { type: "string", required: true, input: true },
        role: {
          type: "string",
          required: true,
          input: false,
          defaultValue: "coordinador",
        },
        numeric: { type: "number", required: false, input: true },
        team: { type: "string", required: false, input: true },
      },
    },
  } as never);
  return { store, db };
}

/** Registro de usuario base para los tests. */
function userData(overrides: Record<string, unknown> = {}) {
  return {
    email: "ana@correo.com",
    emailVerified: false,
    name: "Ana Rivas",
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    username: "a.rivas",
    givenName: "Ana",
    familyName: "Rivas",
    role: "coordinador",
    ...overrides,
  };
}

describe("memoryAdapter (Better Auth DBAdapter)", () => {
  it("creates a user and maintains username/email indices", async () => {
    const { store, db } = buildAdapter();
    const created = await db.create({ model: "user", data: userData() });
    expect(created).toMatchObject({ username: "a.rivas", role: "coordinador" });
    const id = String((created as { id: string }).id);
    expect(store.userById(id)?.email).toBe("ana@correo.com");
    expect(store.userByUsername("a.rivas")?.id).toBe(id);
    expect(store.userByEmail("ANA@correo.com")?.id).toBe(id);
  });

  it("findOne returns the matching record or null", async () => {
    const { db } = buildAdapter();
    const created = await db.create({ model: "user", data: userData() });
    const found = await db.findOne({
      model: "user",
      where: [{ field: "email", value: "ana@correo.com" }],
    });
    expect(found).toMatchObject({ id: (created as { id: string }).id });
    expect(
      await db.findOne({ model: "user", where: [{ field: "email", value: "no@x.com" }] }),
    ).toBeNull();
  });

  it("supports eq, ne, in, not_in, contains, starts_with, ends_with operators", async () => {
    const { db } = buildAdapter();
    for (const suffix of ["1", "2", "3"]) {
      await db.create({
        model: "user",
        data: userData({ email: `u-${suffix}@x.com`, username: `u-${suffix}` }),
      });
    }
    expect(
      (await db.findMany({ model: "user", where: [{ field: "username", value: "u-1", operator: "ne" }] })).length,
    ).toBe(2);
    expect(
      (await db.findMany({ model: "user", where: [{ field: "username", value: ["u-1", "u-2"], operator: "in" }] })).length,
    ).toBe(2);
    expect(
      (await db.findMany({ model: "user", where: [{ field: "username", value: ["u-1"], operator: "not_in" }] })).length,
    ).toBe(2);
    expect(
      (await db.findMany({ model: "user", where: [{ field: "email", value: "2", operator: "contains" }] })).length,
    ).toBe(1);
    expect(
      (await db.findMany({ model: "user", where: [{ field: "email", value: "u-", operator: "starts_with" }] })).length,
    ).toBe(3);
    expect(
      (await db.findMany({ model: "user", where: [{ field: "email", value: "x.com", operator: "ends_with" }] })).length,
    ).toBe(3);
  });

  it("supports gt/gte/lt/lte on numeric values and insensitive comparisons", async () => {
    const { db } = buildAdapter();
    for (const suffix of ["1", "2", "3"]) {
      await db.create({
        model: "user",
        data: userData({
          email: `U-${suffix}@X.COM`,
          username: `u-${suffix}`,
          numeric: Number(suffix),
        }),
      });
    }
    expect(
      (await db.findMany({ model: "user", where: [{ field: "numeric", value: 2, operator: "gt" }] })).length,
    ).toBe(1);
    expect(
      (await db.findMany({ model: "user", where: [{ field: "numeric", value: 2, operator: "gte" }] })).length,
    ).toBe(2);
    expect(
      (await db.findMany({ model: "user", where: [{ field: "numeric", value: 2, operator: "lt" }] })).length,
    ).toBe(1);
    expect(
      (await db.findMany({ model: "user", where: [{ field: "numeric", value: 2, operator: "lte" }] })).length,
    ).toBe(2);
    // mode insensitive (equality + contains)
    expect(
      (await db.findMany({ model: "user", where: [{ field: "email", value: "u-1@x.com", mode: "insensitive" }] })).length,
    ).toBe(1);
    expect(
      (await db.findMany({ model: "user", where: [{ field: "email", value: "-2@", mode: "insensitive", operator: "contains" }] })).length,
    ).toBe(1);
  });

  it("combines clauses with AND and OR connectors", async () => {
    const { db } = buildAdapter();
    await db.create({ model: "user", data: userData({ username: "a", team: "red" }) });
    await db.create({ model: "user", data: userData({ email: "b@x.com", username: "b", team: "blue" }) });

    const andResult = await db.findMany({
      model: "user",
      where: [
        { field: "role", value: "coordinador" },
        { field: "team", value: "red" },
      ],
    });
    expect(andResult).toHaveLength(1);

    const orResult = await db.findMany({
      model: "user",
      where: [
        { field: "team", value: "red" },
        { field: "team", value: "blue", connector: "OR" },
      ],
    });
    expect(orResult).toHaveLength(2);
  });

  it("orders, offsets and limits findMany results", async () => {
    const { db } = buildAdapter();
    for (const suffix of ["3", "1", "2"]) {
      await db.create({
        model: "user",
        data: userData({ username: `u-${suffix}`, numeric: Number(suffix) }),
      });
    }
    const sorted = await db.findMany({
      model: "user",
      sortBy: { field: "numeric", direction: "asc" },
      limit: 2,
      offset: 1,
    });
    expect(sorted.map((r) => (r as { username: string }).username)).toEqual(["u-2", "u-3"]);
  });

  it("update and updateMany apply changes and return expected values", async () => {
    const { db } = buildAdapter();
    await db.create({ model: "user", data: userData({ username: "a" }) });
    await db.create({ model: "user", data: userData({ email: "b@x.com", username: "b" }) });

    const updated = await db.update({
      model: "user",
      where: [{ field: "username", value: "a" }],
      update: { role: "admin_sistema" },
    });
    expect(updated).toMatchObject({ username: "a", role: "admin_sistema" });
    expect(
      await db.update({ model: "user", where: [{ field: "username", value: "none" }], update: { role: "admin_sistema" } }),
    ).toBeNull();

    const count = await db.updateMany({
      model: "user",
      where: [{ field: "role", value: "coordinador" }],
      update: { role: "aprobador" },
    });
    expect(count).toBe(1);
  });

  it("delete, deleteMany and count behave correctly", async () => {
    const { store, db } = buildAdapter();
    const first = await db.create({ model: "user", data: userData({ username: "u-1" }) });
    const firstId = String((first as { id: string }).id);
    await db.create({ model: "user", data: userData({ email: "b@x.com", username: "u-2" }) });

    expect(await db.count({ model: "user" })).toBe(2);
    expect(await db.count({ model: "user", where: [{ field: "username", value: "u-1" }] })).toBe(1);

    await db.delete({ model: "user", where: [{ field: "username", value: "u-1" }] });
    expect(store.userById(firstId)).toBeUndefined();
    expect(store.userByUsername("u-1")).toBeUndefined();

    const deleted = await db.deleteMany({ model: "user", where: [] });
    expect(deleted).toBe(1);
    expect(await db.count({ model: "user" })).toBe(0);
  });

  it("handles session/account/verification models generically", async () => {
    const { db } = buildAdapter();
    await db.create({
      model: "session",
      data: { token: "tok", userId: "u-1", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    });
    expect(await db.count({ model: "session" })).toBe(1);
    expect(
      await db.findOne({ model: "session", where: [{ field: "token", value: "tok" }] }),
    ).toMatchObject({ token: "tok", userId: "u-1" });
    await db.create({
      model: "verification",
      data: { identifier: "x", value: "y", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    });
    await db.create({
      model: "account",
      data: { userId: "u-1", accountId: "a", providerId: "email", createdAt: new Date(), updatedAt: new Date() },
    });
    expect(await db.count({ model: "verification" })).toBe(1);
    expect(await db.count({ model: "account" })).toBe(1);
    await db.deleteMany({ model: "session", where: [] });
    expect(await db.count({ model: "session" })).toBe(0);
  });
});