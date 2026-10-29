import type { Logger } from "pino";
import type { UserRole, UserRepository } from "../../domain/user";
import { ConflictError, NotFoundError } from "../errors";

/**
 * Rol asignable a través de la API.
 *
 * `admin_sistema` queda excluido a propósito: el alta y la baja de
 * administradores es operativa (seed del ambiente), no una transición de este
 * caso de uso (decisiones D1/D5/D6 de `wireframes_admin.md`).
 */
export type AssignableRole = Exclude<UserRole, "admin_sistema">;

/** Dependencias del caso de uso de asignación de rol. */
export type SetUserRoleDeps = {
  users: UserRepository;
  /** Logger pino opcional para la auditoría de cambios de rol (sin PII). */
  logger?: Pick<Logger, "warn">;
};

/** Comando de asignación de rol con trazabilidad del actor. */
export type SetUserRoleCommand = {
  /** Usuario objetivo del cambio. */
  targetId: string;
  /** Rol de destino (nunca `admin_sistema`). */
  role: AssignableRole;
  /** Admin que ejecuta el cambio (para la auditoría). */
  actorId: string;
  /** Id de correlación de la petición (`x-request-id`). */
  requestId?: string;
};

/**
 * Crea el caso de uso de asignación de rol por admin (R16).
 *
 * Reglas:
 * - El rol `admin_sistema` es **inmutable**: ningún administrador puede
 *   cambiarlo, ni el suyo ni el de otro (`ConflictError` → 409). El alta y la
 *   baja de administradores se hace de forma operativa (seed), por lo que la
 *   regla no necesita contar administradores ni bloquear filas.
 * - El cambio es inmediato para la siguiente petición (rol fresco, R14).
 * - Cada cambio exitoso emite una línea de auditoría con actor, objetivo y
 *   transición, sin datos personales (D5).
 *
 * @param deps - Puerto de usuarios y logger opcional.
 * @returns Caso de uso `(command) → void`.
 * @complexity O(1) — una lectura y una escritura por índice primario.
 */
export function setUserRole(deps: SetUserRoleDeps) {
  return async (command: SetUserRoleCommand): Promise<void> => {
    const target = await deps.users.findById(command.targetId);
    if (!target) throw new NotFoundError();
    if (target.role === "admin_sistema") {
      throw new ConflictError(
        "El rol de administrador del sistema es inmutable",
        "immutable_role",
      );
    }

    await deps.users.updateRole(command.targetId, command.role);

    // La lectura previa alimenta el guard y la auditoría: no hay coste extra.
    deps.logger?.warn(
      {
        event: "role_change",
        actorId: command.actorId,
        targetUserId: command.targetId,
        roleBefore: target.role,
        roleAfter: command.role,
        requestId: command.requestId,
      },
      "Role changed",
    );
  };
}
