import type { Hono } from "hono";
import { getProfile } from "../application/users/get-profile";
import { listAuthors } from "../application/users/list-authors";
import { usernameSchema } from "../domain/validation";
import { requireSession } from "../middleware/require-session";
import type { RouteDeps } from "./route-deps";
import { validationError } from "./helpers";

/**
 * Registra las rutas de usuarios (api-structure.md §9.4):
 * `GET /users/authors` y `GET /users/:username`.
 *
 * Ambas requieren sesión. `authors` solo devuelve `AuthorOption` (sin email ni
 * rol, R18); el perfil redacta el email de terceros a `""` y responde 404
 * genérico ante username inexistente (anti-enumeración).
 *
 * @param app  - App Hono.
 * @param deps - Dependencias inyectadas.
 */
export function registerUserRoutes(app: Hono, deps: RouteDeps): void {
  const { auth, users } = deps;
  const listAuthorsUseCase = listAuthors({ users });
  const getProfileUseCase = getProfile({ users });

  app.get(
    "/api/v1/users/authors",
    requireSession(auth, users),
    async (c) => {
      const authors = await listAuthorsUseCase();
      return c.json(authors, 200);
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