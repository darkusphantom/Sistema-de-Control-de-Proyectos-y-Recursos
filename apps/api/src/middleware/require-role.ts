import type { MiddlewareHandler } from "hono";
import type { Session } from "../domain/session";
import type { UserRole } from "../domain/user";
import { ForbiddenError, UnauthorizedError } from "../application/errors";

/**
 * Middleware de enforcement por rol (requisito R11/R16).
 *
 * Responde 403 si el rol FRESCO de `c.var.session` no está en la lista
 * permitida. Debe ejecutarse DESPUÉS de `requireSession` (que fija la sesión).
 *
 * @param roles - Roles permitidos (p. ej. `requireRole("admin_sistema")`).
 * @returns Middleware de Hono.
 */
export function requireRole(...roles: UserRole[]): MiddlewareHandler {
  return async (c, next) => {
    const session: Session | undefined = c.get("session");
    if (!session) throw new UnauthorizedError();
    if (!roles.includes(session.user.role)) throw new ForbiddenError();
    await next();
  };
}