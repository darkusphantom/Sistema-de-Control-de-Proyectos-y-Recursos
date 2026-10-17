import type { UserRole, UserRepository } from "../../domain/user";
import { NotFoundError } from "../errors";

/** Dependencias del caso de uso de asignación de rol. */
export type SetUserRoleDeps = {
  users: UserRepository;
};

/**
 * Crea el caso de uso de asignación de rol por admin (R16).
 *
 * El cambio es inmediato para la siguiente petición (rol fresco, R14). Solo el
 * middleware `requireRole("admin_sistema")` garantiza que solo un admin del
 * sistema llegue aquí.
 *
 * @param deps - Puerto de usuarios.
 * @returns Caso de uso `(id, role) → void`.
 */
export function setUserRole(deps: SetUserRoleDeps) {
  return async (id: string, role: UserRole): Promise<void> => {
    const updated = await deps.users.updateRole(id, role);
    if (!updated) throw new NotFoundError();
  };
}