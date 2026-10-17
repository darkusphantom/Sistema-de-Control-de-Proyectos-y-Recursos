import type { User } from "@/lib/types";

/**
 * Patch de datos personales aceptado por {@link UserRepository.update}.
 * Solo campos editables desde el perfil; nunca `role` ni `id`.
 */
export type UpdateProfilePatch = Partial<
  Pick<User, "givenName" | "familyName" | "email" | "bio" | "avatarUrl">
>;

/**
 * Hexagonal port for user data access (profile reads and updates).
 *
 * Implementations:
 * - `user-repository.static.ts` — reads `src/data/users.ts` (static phase).
 * - Future: PostgreSQL/Supabase adapter (same interface, no changes to callers).
 */
export interface UserRepository {
  /** Devuelve un usuario por username, o `null`. */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Aplica un parche de datos personales. Devuelve el usuario actualizado
   * o `null` si el id no existe. Los campos fuera del parche no cambian.
   *
   * @param id - Id del usuario.
   * @param patch - Campos a actualizar.
   */
  update(id: string, patch: UpdateProfilePatch): Promise<User | null>;
}
