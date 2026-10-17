import type { Hono } from "hono";
import { getProfile } from "../application/users/get-profile";
import { listByRole } from "../application/users/list-by-role";
import { usernameSchema } from "../domain/validation";
import { requireSession } from "../middleware/require-session";
import type { RouteDeps } from "./route-deps";
import { validationError } from "./helpers";

/**
 * Registra las rutas de usuarios (api-structure.md §9.4):
 * `GET /users/coordinadores` y `GET /users/:username`.
 *
 * Ambas requieren sesión. `coordinadores` lista los usuarios con rol
 * `coordinador` como `UserOption` (sin email ni rol, R18) para los selectores
 * del sistema (pivot-project.md §7); el perfil redacta el email de terceros a
 * `""` y responde 404 genérico ante username inexistente (anti-enumeración).
 *
 * @param app  - App Hono.
 * @param deps - Dependencias inyectadas.
 */
export function registerUserRoutes(app: Hono, deps: RouteDeps): void {
  const { auth, users } = deps;
  const listByRoleUseCase = listByRole({ users });
  const getProfileUseCase = getProfile({ users });

  app.get(
    "/api/v1/users/coordinadores",
    requireSession(auth, users),
    async (c) => {
      const coordinadores = await listByRoleUseCase("coordinador");
      return c.json(coordinadores, 200);
    },
  );

  app.get(
    "/api/v1/users/:username",
    requireSession(auth, users),
    async (c) => {
      const parsed = usernameSchema.safeParse(c.req.param("username"));
      if (!parsed.success) return validationError(c, parsed.error);
      const profile = await getProfileUseCase(parsed.data, c.get("session"));
      return c.json(profile, 200);
    },
  );
}
