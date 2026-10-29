import { describe, expect, it, vi } from "vitest";
import type { AppAuth } from "../../infrastructure/auth/auth.config";
import type { User, UserRepository } from "../../domain/user";
import { InvalidCredentialsError } from "../errors";
import * as decoyModule from "./password-decoy";
import { createSignInUser } from "./sign-in";

const USER: User = {
  id: "u-1",
  username: "maria.rivas",
  email: "maria@correo.com",
  givenName: "María",
  familyName: "Rivas",
  role: "coordinador",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const COMMAND = { username: "maria.rivas", password: "secreto123" };

/**
 * Repositorio de usuarios falso.
 *
 * @param overrides - Reemplazos de métodos.
 * @returns Puerto `UserRepository` falso.
 */
function makeUsersRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  const defaults: UserRepository = {
    listByRole: async () => [],
    findById: async (id) => (id === USER.id ? USER : null),
    findByUsername: async () => null,
    findByEmail: async () => null,
    updateRole: async (_id, role) => ({ ...USER, role }),
  };
  return { ...defaults, ...overrides };
}

/**
 * Instancia de Better Auth falsa con `signInEmail` configurable.
 *
 * @param signInEmail - Comportamiento de `auth.api.signInEmail`.
 * @returns Auth falsa.
 */
function makeAuth(
  signInEmail: (args: {
    body: Record<string, unknown>;
    headers: HeadersInit;
    returnHeaders: boolean;
    returnStatus: boolean;
  }) => Promise<unknown>,
): AppAuth {
  return {
    api: { signInEmail: vi.fn(signInEmail) },
  } as unknown as AppAuth;
}

describe("createSignInUser", () => {
  it("runs the async decoy for an unknown user and returns the same 401 (H5)", async () => {
    const users = makeUsersRepo();
    const auth = makeAuth(async () => {
      throw new Error("no debe llegar aquí");
    });
    const spy = vi.spyOn(decoyModule, "verifyPasswordDecoy");
    spy.mockResolvedValue(undefined);

    const signIn = createSignInUser({ auth, users });
    await expect(signIn(COMMAND, new Headers())).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(COMMAND.password);
  });

  it("logs the underlying error while keeping the wire 401 (sugerencia)", async () => {
    const users = makeUsersRepo({
      findByUsername: async () => USER,
    });
    const auth = makeAuth(async () => {
      throw new Error("contraseña incorrecta");
    });
    const logger = { warn: vi.fn() };

    const signIn = createSignInUser({ auth, users, logger });
    await expect(signIn(COMMAND, new Headers())).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
    expect(logger.warn).toHaveBeenCalledTimes(1);
    const [payload] = logger.warn.mock.calls[0];
    expect(payload).toMatchObject({
      event: "login_failed",
      reason: "invalid_credentials",
    });
    expect(JSON.stringify(payload)).not.toContain(COMMAND.username);
  });
});