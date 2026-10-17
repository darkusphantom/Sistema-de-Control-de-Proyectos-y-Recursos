/**
 * Re-exportaciones de tipos de usuario desde `@redfacyt/shared`.
 *
 * Shim de compatibilidad: todos los imports existentes en `apps/api`
 * que apuntan a `../domain/user` continúan funcionando sin modificaciones.
 *
 * @module domain/user
 */

import type { UserRole, User, UserOption } from "@redfacyt/shared";

export type { UserRole, User, UserOption };

/**
 * Puerto hexagonal para el acceso a datos de usuarios.
 *
 * Los adaptadores de `infrastructure/repositories/` implementan este puerto.
 */

export interface UserRepository {
  /**
   * Devuelve los usuarios con el rol indicado, ordenados por nombre completo
   * con locale `"es"` para un orden estable entre sistemas.
   *
   * @param role - Rol a filtrar (pivot-project.md §7).
   * @returns Opciones de usuario ordenadas por nombre completo.
   */
  listByRole(role: UserRole): Promise<UserOption[]>;

  /**
   * Busca un usuario por su id.
   *
   * @param id - Id del usuario.
   * @returns El usuario, o `null` si no existe.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Busca un usuario por su username (identificador de acceso, auth.md §10.1).
   *
   * @param username - Username (sin mayúsculas).
   * @returns El usuario, o `null` si no existe.
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Busca un usuario por su email (unicidad sin distinguir mayúsculas, R12).
   *
   * @param email - Email.
   * @returns El usuario, o `null` si no existe.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Actualiza el rol de un usuario. El efecto es inmediato para la siguiente
   * petición (rol fresco, requisito R14 de threat-model-api.md).
   *
   * @param id   - Id del usuario.
   * @param role - Nuevo rol.
   * @returns El usuario actualizado, o `null` si no existe.
   */
  updateRole(id: string, role: UserRole): Promise<User | null>;
}