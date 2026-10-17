import type { UserRole } from "@/lib/types";

/**
 * Determina si el rol de un usuario puede ser cambiado.
 * Por regla de seguridad (D2 / F-01), el rol `admin_sistema` es inmutable
 * desde la aplicación.
 *
 * @param targetRole - El rol actual del usuario al que se le intenta cambiar el rol.
 * @returns `true` si el rol puede ser cambiado, `false` si está bloqueado.
 */
export function canChangeRole(targetRole: UserRole): boolean {
  return targetRole !== "admin_sistema";
}
