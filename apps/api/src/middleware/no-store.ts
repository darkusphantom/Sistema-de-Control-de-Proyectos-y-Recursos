import type { MiddlewareHandler } from "hono";

/**
 * Prohíbe el cacheo de respuestas de la API (requisito R6).
 *
 * Las respuestas llevan datos de sesión y de negocio: ningún intermediario
 * (navegador, proxy o CDN) debe almacenarlas. Se aplica a todo el árbol
 * `/api/v1/*` una sola vez; el coste es fijar una cabecera, O(1) por request.
 *
 * @returns Middleware de Hono.
 */
export function noStore(): MiddlewareHandler {
  return async (c, next) => {
    await next();
    c.header("Cache-Control", "no-store");
  };
}
