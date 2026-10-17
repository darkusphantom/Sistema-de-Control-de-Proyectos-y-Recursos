import { Hono } from "hono";
import { pino } from "pino";
import type { Logger } from "pino";
import type { Env } from "./config/env";
import type { UserRepository } from "./domain/user";
import type { AppAuth } from "./infrastructure/auth/auth.config";
import { createAuth } from "./infrastructure/auth/auth.config";
import { InMemoryUserRepository } from "./infrastructure/repositories/in-memory/in-memory-user-repository";
import { MemoryUserStore } from "./infrastructure/repositories/in-memory/user-store";
import { bodyLimitMiddleware } from "./middleware/body-limit";
import { corsWhitelist } from "./middleware/cors";
import { parseCorsOrigins } from "./middleware/cors";
import { ensureCsrfToken } from "./middleware/csrf";
import { createErrorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";
import { MemoryRateLimiter } from "./middleware/rate-limit";
import { requestId } from "./middleware/request-id";
import { securityHeaders } from "./middleware/security-headers";
import { registerAdminRoutes } from "./routes/admin.routes";
import { registerAuthRoutes } from "./routes/auth.routes";
import { registerOpenApiRoutes } from "./routes/openapi";
import type { RouteDeps } from "./routes/route-deps";
import { registerUserRoutes } from "./routes/users.routes";

/**
 * Opciones de creación de la app: entorno tipado, store compartido y, de
 * forma opcional, auth/repositorios inyectables (para tests y el futuro
 * PostgreSQL sin rework).
 */
export type AppOptions = {
  env: Env;
  /**
   * Logger pino opcional (p. ej. inyectado por el bootstrap). Si no se
   * proporciona, `createApp` crea uno con el nivel de `env.LOG_LEVEL`.
   */
  logger?: Logger;
  /** Store en memoria compartido (fuente única de verdad). */
  store: MemoryUserStore;
  /** Instancia de Better Auth (por defecto se construye con `createAuth`). */
  auth?: AppAuth;
  /** Repositorio de usuarios (por defecto `InMemoryUserRepository`). */
  users?: UserRepository;
};

/**
 * Crea la app Hono con el pipeline de seguridad y todas las rutas `/api/v1/*`.
 *
 * Función pura (no abre puertos): los tests llaman `app.request()`. Los
 * middlewares de seguridad se aplican antes de las rutas: request-id →
 * security headers → CORS → body limit. `createApp` construye una única vez
 * el store, los repositorios, el auth y el rate limiter y los inyecta en los
 * módulos de rutas (patrón Factory + Dependency Injection).
 *
 * @param options - Opciones tipadas (entorno, store, auth/repos opcionales).
 * @returns Instancia de Hono configurada y lista para servir.
 */
export function createApp(options: AppOptions): Hono {
  const { env, logger = pino({ level: env.LOG_LEVEL }) } = options;
  const store = options.store;
  const users = options.users ?? new InMemoryUserRepository(store);
  const auth = options.auth ?? createAuth(env, store);
  const limiter = new MemoryRateLimiter(
    env.RATE_LIMIT_MAX,
    env.RATE_LIMIT_WINDOW_MS,
  );
  const trustedOrigins = parseCorsOrigins(env.CORS_ORIGINS);
  const deps: RouteDeps = {
    env,
    auth,
    users,
    limiter,
    trustedOrigins,
    logger,
  };

  const app = new Hono();

  app.use("*", requestId());
  app.use("*", securityHeaders());
  app.use("*", corsWhitelist(env.CORS_ORIGINS));
  app.use("*", bodyLimitMiddleware(env.MAX_BODY_BYTES));
  // Emite la cookie de doble envío CSRF en TODAS las respuestas si falta, de
  // modo que el cliente siempre puede obtenerla antes de mutar (H3).
  app.use("*", ensureCsrfToken(env));

  app.get("/api/v1/health", (c) =>
    c.json({ status: "ok", timestamp: new Date().toISOString() }),
  );

  registerAuthRoutes(app, deps);
  registerUserRoutes(app, deps);
  registerAdminRoutes(app, deps);
  registerOpenApiRoutes(app, deps);

  app.notFound(notFound);
  app.onError(createErrorHandler({ env, logger }));
  return app;
}