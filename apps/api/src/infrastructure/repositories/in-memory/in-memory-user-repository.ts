import type {
  User,
  UserRepository,
  UserOption,
  UserRole,
} from "../../../domain/user";
import { MemoryUserStore } from "./user-store";

/**
 * Implementación en memoria del puerto `UserRepository`.
 *
 * Lee del `MemoryUserStore` compartido (fuente única de verdad), de modo que
 * los usuarios creados por Better Auth son visibles al instante y los cambios
 * de rol por admin son efectivos en la siguiente petición (R14).
 */
export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly store: MemoryUserStore) {}

  /**
   * Devuelve los usuarios registrados con el rol indicado como opciones
   * ligeras, ordenados por nombre completo con locale `"es"`. Solo
   * `{ id, username, fullName }`: nunca email ni rol (R18).
   *
   * Complejidad: O(n) por el filtro + O(n log n) dominado por el orden.
   *
   * @param role - Rol a filtrar.
   * @returns Opciones de usuario.
   */
  async listByRole(role: UserRole): Promise<UserOption[]> {
    const options: UserOption[] = this.store
      .allUsers()
      .filter((user) => user.role === role)
      .map((user) => ({
        id: user.id,
        username: user.username,
        fullName: `${user.givenName} ${user.familyName}`,
      }));
    options.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
    return options;
  }

  /**
   * Busca un usuario por su id (O(1)).
   *
   * @param id - Id del usuario.
   * @returns El usuario en forma wire, o `null`.
   */
  async findById(id: string): Promise<User | null> {
    const stored = this.store.userById(id);
    return stored ? this.store.toDomainUser(stored) : null;
  }

  /**
   * Busca un usuario por su username (O(1), sin distinguir mayúsculas).
   *
   * @param username - Username.
   * @returns El usuario en forma wire, o `null`.
   */
  async findByUsername(username: string): Promise<User | null> {
    const stored = this.store.userByUsername(username);
    return stored ? this.store.toDomainUser(stored) : null;
  }

  /**
   * Busca un usuario por su email (O(1), sin distinguir mayúsculas).
   *
   * @param email - Email.
   * @returns El usuario en forma wire, o `null`.
   */
  async findByEmail(email: string): Promise<User | null> {
    const stored = this.store.userByEmail(email);
    return stored ? this.store.toDomainUser(stored) : null;
  }

  /**
   * Actualiza el rol de un usuario; el cambio es inmediato (R14).
   *
   * @param id   - Id del usuario.
   * @param role - Nuevo rol.
   * @returns El usuario actualizado, o `null` si no existe.
   */
  async updateRole(id: string, role: UserRole): Promise<User | null> {
    const stored = this.store.userById(id);
    if (!stored) return null;
    const updated: typeof stored = { ...stored, role, updatedAt: new Date() };
    this.store.saveUser(updated);
    return this.store.toDomainUser(updated);
  }
}