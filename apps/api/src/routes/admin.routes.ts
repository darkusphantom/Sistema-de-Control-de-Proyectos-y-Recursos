import type { Hono } from "hono";
import { setUserRole } from "../application/admin/set-user-role";
import { SetUserRoleSchema, idSchema } from "../domain/validation";
import { csrf } from "../middleware/csrf";
import { requireRole } from "../middleware/require-role";
import { requireSession } from "../middleware/require-session";
import type { RouteDeps } from "./route-deps";
import { parseJsonBody, validationError } from "./helpers";

/**
 * Registra las rutas de admin (api-structure.md §9.5):
 * `PATCH /admin/users/:id/role`.
 *
 * Matriz de enforcement (R16): solo `admin_sistema`, verificado EN SERVIDOR
 * por petición (`requireSession` + `requireRole("admin_sistema")`) con el rol
 * fresco del store (R14). Mutaciones con CSRF. Id inexistente → 404.
 *
 * @param app  - App Hono.
 * @param deps - Dependencias inyectadas.
 */
export function registerAdminRoutes(app: Hono, deps: RouteDeps): void {
  const { auth, users, trustedOrigins } = deps;
  const csrfMiddleware = csrf(trustedOrigins);
  const setUserRoleUseCase = setUserRole({ users });

  app.patch(
    "/api/v1/admin/users/:id/role",
    requireSession(auth, users),
    requireRole("admin_sistema"),
    csrfMiddleware,
    async (c) => {
      const idParsed = idSchema.safeParse(c.req.param("id"));
      if (!idParsed.success) return validationError(c, idParsed.error);
      const body = await parseJsonBody(c);
      const parsed = SetUserRoleSchema.safeParse(body);
      if (!parsed.success) return validationError(c, parsed.error);
      await setUserRoleUseCase(idParsed.data, parsed.data.role);
      return c.body(null, 204);
    },
  );
}