import type { UserOption, UserRole } from "../../domain/user";
import type { UserRepository } from "../../domain/user";

/** Dependencias del caso de uso de listado de usuarios por rol. */
export type ListByRoleDeps = {
  users: UserRepository;
};

/**
 * Crea el caso de uso de listado de usuarios filtrados por rol.
 *
 * Tras el pivot, `GET /users/coordinadores` lista los coordinadores para los
 * selectores del sistema (pivot-project.md §7). Orden `es`; nunca incluye
 * email ni rol (R18).
 *
 * @param deps - Puerto de usuarios.
 * @returns Caso de uso `(role) → UserOption[]`.
 */
export function listByRole(deps: ListByRoleDeps) {
  return async (role: UserRole): Promise<UserOption[]> =>
    deps.users.listByRole(role);
}
