import type { Hono } from "hono";
import type { Context } from "hono";
import { createRegisterUser } from "../application/auth/register-user";
import { createSignInUser } from "../application/auth/sign-in";
import { getCurrentSession, signOutUser } from "../application/auth/session";
import { UnauthorizedError } from "../application/errors";
import { LoginSchema, RegisterSchema } from "../domain/validation";
import { csrf } from "../middleware/csrf";
import { clientIp } from "../middleware/rate-limit";
import type { MemoryRateLimiter } from "../middleware/rate-limit";
import type { RouteDeps } from "./route-deps";
import { applySetCookies, parseJsonBody, validationError } from "./helpers";

/**
 * Comprueba el rate limit del REGISTRO (R12): cuenta TODOS los requests por IP
 * (una mutación pública repetida es abuso potencial). Responde `false` si la
 * clave está bloqueada.
 *
 * @param c       - Contexto de Hono.
 * @param limiter - Limiter compartido.
 * @returns `true` si se permite la petición.
 */
function registerAllowed(c: Context, limiter: MemoryRateLimiter): boolean {
  return limiter.check(`auth:register:ip:${clientIp(c)}`);
}

/**
 * Comprueba el rate limit de LOGIN (R13): por IP y por username. A diferencia
 * del registro, aquí NO se cuenta el request: solo cuentan los intentos
 * FALLIDOS (ver `recordLoginFailure`), de modo que un usuario legítimo que
 * inicia sesión varias veces no se autobloquea (H2).
 *
 * @param c        - Contexto de Hono.
 * @param limiter  - Limiter compartido.
 * @param username - Username del intento de login.
 * @returns `true` si se permite el intento.
 */
function loginAllowed(
  c: Context,
  limiter: MemoryRateLimiter,
  username: string,
): boolean {
  const ipKey = `auth:login:ip:${clientIp(c)}`;
  const userKey = `auth:login:user:${username.toLowerCase()}`;
  if (limiter.isBlocked(ipKey) || limiter.isBlocked(userKey)) return false;
  return true;
}

/**
 * Registra un intento de login FALLIDO contra el rate limit (por IP y por
 * username). Solo se llama tras una credencial inválida (H2).
 *
 * @param c        - Contexto de Hono.
 * @param limiter  - Limiter compartido.
 * @param username - Username del intento fallido.
 */
function recordLoginFailure(
  c: Context,
  limiter: MemoryRateLimiter,
  username: string,
): void {
  limiter.record(`auth:login:ip:${clientIp(c)}`);
  limiter.record(`auth:login:user:${username.toLowerCase()}`);
}

/**
 * Registra las rutas de auth del contrato wire (api-structure.md §8.4 y §9.2):
 * `POST /register`, `POST /login`, `GET /session`, `POST /logout`.
 *
 * NUNCA se monta el handler nativo de Better Auth (`auth.handler`) bajo
 * `/api/v1/auth/*` (hallazgo H1): las rutas nativas (`/sign-in/email`,
 * `/sign-up/email`, `/sign-out`, `/get-session`) quedarían sin rate limit,
 * sin CSRF y sin validación zod, y sus respuestas diferenciadas permiten
 * enumeración de cuentas. Solo se exponen las rutas wire, que llaman a
 * `auth.api.*` y ya llevan rate limit + CSRF (doble envío) + zod. La cookie
 * CSRF la emite el middleware global `ensureCsrfToken` montado en `createApp`.
 *
 * El registro solo crea `coordinador`; el `role` del body se ignora (R12).
 *
 * @param app  - App Hono.
 * @param deps - Dependencias inyectadas.
 */
export function registerAuthRoutes(app: Hono, deps: RouteDeps): void {
  const { auth, users, limiter, trustedOrigins } = deps;
  const csrfMiddleware = csrf(trustedOrigins);
  const registerUser = createRegisterUser({ auth, users });
  const signInUser = createSignInUser({ auth, users, logger: deps.logger });

  app.post("/api/v1/auth/register", csrfMiddleware, async (c) => {
    const body = await parseJsonBody(c);
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) return validationError(c, parsed.error);
    if (!registerAllowed(c, limiter)) {
      return c.json(
        {
          error: "rate_limited",
          message: "Demasiadas solicitudes. Intenta de nuevo más tarde.",
        },
        429,
      );
    }
    const result = await registerUser(parsed.data, c.req.raw.headers);
    applySetCookies(c, result.setCookies);
    return c.json(result.session, 201);
  });

  app.post("/api/v1/auth/login", csrfMiddleware, async (c) => {
    const body = await parseJsonBody(c);
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) return validationError(c, parsed.error);
    if (!loginAllowed(c, limiter, parsed.data.username)) {
      return c.json(
        {
          error: "rate_limited",
          message: "Demasiadas solicitudes. Intenta de nuevo más tarde.",
        },
        429,
      );
    }
    try {
      const result = await signInUser(parsed.data, c.req.raw.headers);
      applySetCookies(c, result.setCookies);
      return c.json(result.session, 200);
    } catch (error) {
      // Solo los intentos FALLIDOS cuentan contra el rate limit (H2).
      recordLoginFailure(c, limiter, parsed.data.username);
      throw error;
    }
  });

  app.get("/api/v1/auth/session", async (c) => {
    const session = await getCurrentSession(auth, users, c.req.raw.headers);
    if (!session) throw new UnauthorizedError();
    return c.json(session, 200);
  });

  app.post("/api/v1/auth/logout", csrfMiddleware, async (c) => {
    const setCookies = await signOutUser(auth, c.req.raw.headers);
    applySetCookies(c, setCookies);
    return c.body(null, 204);
  });
}