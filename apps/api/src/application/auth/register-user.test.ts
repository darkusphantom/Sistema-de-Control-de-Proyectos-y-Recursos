import { APIError } from "better-auth";
import { describe, expect, it, vi } from "vitest";
import type { AppAuth } from "../../infrastructure/auth/auth.config";
import type { User, UserRepository } from "../../domain/user";
import { ConflictError } from "../errors";
import * as decoyModule from "./password-decoy";
import {
  createRegisterUser,
  defaultUsernameGenerator,
  ensureUniqueUsername,
} from "./register-user";

const EXISTING_USER: User = {
  id: "u-1",
  username: "maria.rivas",
  email: "maria@correo.com",
  givenName: "María",
  familyName: "Rivas",
  role: "coordinador",
  createdAt: "2026-01-01T00:00:00.000Z",
};

/** Cuerpo de registro mínimo válido. */
const COMMAND = {
  givenName: "María",
  familyName: "Rivas",
  email: "nueva@correo.com",
  password: "secreto123",
};

/**
 * Repositorio de usuarios falso con comportamiento configurable.
 *
 * @param overrides - Reemplazos de métodos.
 * @returns Puerto `UserRepository` falso.
 */
function makeUsersRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  const defaults: UserRepository = {
    listByRole: async () => [],
    findById: async (id) => (id === EXISTING_USER.id ? EXISTING_USER : null),
    findByUsername: async () => null,
    findByEmail: async () => null,
    updateRole: async (_id, role) => ({ ...EXISTING_USER, role }),
  };
  return { ...defaults, ...overrides };
}

/**
 * Instancia de Better Auth falsa donde solo se configura `signUpEmail`.
 *
 * @param signUpEmail - Comportamiento de `auth.api.signUpEmail`.
 * @returns Auth falsa.
 */
function makeAuth(
  signUpEmail: (args: {
    body: Record<string, unknown>;
    headers: HeadersInit;
    returnHeaders: boolean;
    returnStatus: boolean;
  }) => Promise<unknown>,
): AppAuth {
  return {
    api: { signUpEmail: vi.fn(signUpEmail) },
  } as unknown as AppAuth;
}

describe("defaultUsernameGenerator", () => {
  it("normalizes to lowercase without diacritics and joins with a dot", () => {
    expect(defaultUsernameGenerator("María", "Rivas")).toBe("maria.rivas");
    expect(defaultUsernameGenerator("José Luis", "Ramírez")).toBe(
      "joseluis.ramirez",
    );
  });
});

describe("ensureUniqueUsername", () => {
  it("keeps every candidate within the 50-char username contract", async () => {
    const taken = new Set<string>(["a".repeat(50)]);
    const users = makeUsersRepo({
      findByUsername: async (username) =>
        taken.has(username) ? EXISTING_USER : null,
    });
    const username = await ensureUniqueUsername(users, "a".repeat(50));
    expect(username.length).toBeLessThanOrEqual(50);
    expect(username).toMatch(/^[a-z0-9._-]+$/);
  });
});

describe("createRegisterUser", () => {
  it("runs the password decoy when the email already exists (H5)", async () => {
    const users = makeUsersRepo({
      findByEmail: async () => EXISTING_USER,
    });
    const auth = makeAuth(async () => {
      throw new Error("no debe llegar aquí");
    });
    const spy = vi.spyOn(decoyModule, "verifyPasswordDecoy");
    spy.mockResolvedValue(undefined);

    const register = createRegisterUser({ auth, users });
    await expect(register(COMMAND, new Headers())).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(COMMAND.password);
  });

  it("does NOT wrap non-conflict errors as 409; they propagate (QA-1)", async () => {
    const users = makeUsersRepo();
    const auth = makeAuth(async () => {
      throw new Error("boom interno");
    });
    const register = createRegisterUser({ auth, users });
    await expect(register(COMMAND, new Headers())).rejects.toThrow(
      "boom interno",
    );
  });

  it("maps a Better Auth 422 duplicate (conflict) to ConflictError (QA-1)", async () => {
    const users = makeUsersRepo();
    const auth = makeAuth(async () => {
      throw APIError.from("UNPROCESSABLE_ENTITY", {
        code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
        message: "User already exists. Use another email.",
      });
    });
    const register = createRegisterUser({ auth, users });
    const error = await register(COMMAND, new Headers()).catch((err) => err);
    expect(error).toBeInstanceOf(ConflictError);
    expect((error as ConflictError).code).toBe("account_conflict");
  });
});