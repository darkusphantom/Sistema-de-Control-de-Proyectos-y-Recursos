import type { AppAuth } from "../infrastructure/auth/auth.config";
import type { Env } from "../config/env";
import type { UserRepository } from "../domain/user";
import type { MemoryRateLimiter } from "../middleware/rate-limit";
import type { Logger } from "pino";

/**
 * Dependencias compartidas por los módulos de rutas.
 *
 * `createApp` construye una única vez el store, los repositorios, el auth, el
 * limiter y la whitelist de orígenes, y los inyecta en los montadores de rutas
 * (patrón Factory + Dependency Injection; testabilidad con `app.request()`).
 */
export type RouteDeps = {
  env: Env;
  auth: AppAuth;
  users: UserRepository;
  limiter: MemoryRateLimiter;
  /** Orígenes permitidos (whitelist CORS) para el middleware de CSRF. */
  trustedOrigins: string[];
  /** Logger pino (para observabilidad sin exponer detalles en el wire). */
  logger?: Logger;
};