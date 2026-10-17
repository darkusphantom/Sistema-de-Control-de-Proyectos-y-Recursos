import type { User, UserRole } from "../../../domain/user";

/**
 * Registro de usuario tal y como lo persiste Better Auth (campos core:
 * `email`, `emailVerified`, `name`, `image`, `createdAt`, `updatedAt`) más
 * nuestros `additionalFields` (`username`, `givenName`, `familyName`, `role`).
 */
export type StoredUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  username: string;
  givenName: string;
  familyName: string;
  role: UserRole;
} & Record<string, unknown>;

/** Sesión de Better Auth persistida en memoria. */
export type StoredSession = {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
} & Record<string, unknown>;

/** Cuenta de proveedor de Better Auth. */
export type StoredAccount = {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
} & Record<string, unknown>;

/** Token de verificación de Better Auth. */
export type StoredVerification = {
  id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
} & Record<string, unknown>;

/** Modelos que gestiona el adaptador de Better Auth. */
export type AuthModelName = "user" | "session" | "account" | "verification";

/** Cualquier registro persistido por el adaptador de auth. */
export type AuthRecord =
  | StoredUser
  | StoredSession
  | StoredAccount
  | StoredVerification;

/**
 * Única fuente de verdad en memoria del MVP (api-structure.md §11.1).
 *
 * `InMemoryUserRepository` y el adaptador de auth de Better Auth leen/escriben
 * el MISMO store: un usuario registrado por Better Auth queda visible para los
 * casos de uso al instante y un cambio de rol por admin es efectivo en la
 * siguiente petición (R14).
 *
 * Índices: `byUsername`/`byEmail` (O(1)) para las búsquedas del repositorio de
 * usuarios; el adaptador de auth recorre colecciones (O(n), n pequeño en el
 * MVP) porque Better Auth consulta por campos variados (id, token, userId...).
 */
export class MemoryUserStore {
  private readonly usersById = new Map<string, StoredUser>();
  private readonly usersByUsername = new Map<string, string>();
  private readonly usersByEmail = new Map<string, string>();
  private readonly sessions = new Map<string, StoredSession>();
  private readonly accounts = new Map<string, StoredAccount>();
  private readonly verifications = new Map<string, StoredVerification>();

  /**
   * Colección de auth por modelo (O(1)).
   *
   * @param model - Modelo de Better Auth.
   * @returns Mapa id → registro del modelo.
   */
  authCollection(model: AuthModelName): Map<string, AuthRecord> {
    if (model === "user") return this.usersById as Map<string, AuthRecord>;
    if (model === "session") return this.sessions as Map<string, AuthRecord>;
    if (model === "account") return this.accounts as Map<string, AuthRecord>;
    return this.verifications as Map<string, AuthRecord>;
  }

  /**
   * Inserta o reemplaza un registro de usuario manteniendo los índices.
   *
   * @param user - Registro de usuario.
   */
  saveUser(user: StoredUser): void {
    this.usersById.set(user.id, user);
    this.usersByUsername.set(user.username.toLowerCase(), user.id);
    this.usersByEmail.set(user.email.toLowerCase(), user.id);
  }

  /**
   * Elimina un usuario y sus índices.
   *
   * @param id - Id del usuario.
   */
  removeUser(id: string): void {
    const user = this.usersById.get(id);
    if (user) {
      this.usersByUsername.delete(user.username.toLowerCase());
      this.usersByEmail.delete(user.email.toLowerCase());
    }
    this.usersById.delete(id);
  }

  /**
   * Devuelve un usuario por su id (O(1)).
   *
   * @param id - Id del usuario.
   * @returns El usuario, o `undefined`.
   */
  userById(id: string): StoredUser | undefined {
    return this.usersById.get(id);
  }

  /**
   * Devuelve un usuario por su username (O(1), comparación sin mayúsculas).
   *
   * @param username - Username.
   * @returns El usuario, o `undefined`.
   */
  userByUsername(username: string): StoredUser | undefined {
    const id = this.usersByUsername.get(username.toLowerCase());
    return id === undefined ? undefined : this.usersById.get(id);
  }

  /**
   * Devuelve un usuario por su email (O(1), comparación sin mayúsculas).
   *
   * @param email - Email.
   * @returns El usuario, o `undefined`.
   */
  userByEmail(email: string): StoredUser | undefined {
    const id = this.usersByEmail.get(email.toLowerCase());
    return id === undefined ? undefined : this.usersById.get(id);
  }

  /**
   * Devuelve todos los usuarios (para `listAuthors` y recorridos del adaptador).
   *
   * @returns Arreglo de usuarios.
   */
  allUsers(): StoredUser[] {
    return [...this.usersById.values()];
  }

  /**
   * Mapea un usuario almacenado a la forma wire `User`.
   *
   * @param stored - Registro de usuario.
   * @returns Usuario en forma wire.
   */
  toDomainUser(stored: StoredUser): User {
    return {
      id: stored.id,
      username: stored.username,
      email: stored.email,
      givenName: stored.givenName,
      familyName: stored.familyName,
      role: stored.role,
      createdAt: stored.createdAt.toISOString(),
    };
  }
}