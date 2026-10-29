import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Env } from "../config/env";
import type { MiddlewareHandler } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { ForbiddenError } from "../application/errors";

/** Nombre de la cookie de doble envío CSRF (leíble por JS). */
export const CSRF_COOKIE_NAME = "facy.csrf_token";

/** Header de doble envío CSRF exigido en mutaciones. */
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Comparación en tiempo constante de dos cadenas (anti timing attack).
 *
 * Los tokens son hex ASCII, así que comparar buffers equivale a comparar los
 * textos. `timingSafeEqual` exige longitudes iguales: la comprobación previa
 * evita su excepción y no filtra el contenido, solo la longitud.
 *
 * @param a - Primer valor.
 * @param b - Segundo valor.
 * @returns `true` si son idénticas.
 * @complexity O(n) con n = longitud del token (32 bytes fijos).
 */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Middleware de doble envío CSRF (requisito R13, `api-structure.md` §11.4).
 *
 * Aplica a TODAS las mutaciones (`POST`/`PATCH`/`PUT`/`DELETE`) de la API:
 * - `Origin` presente fuera de la whitelist (o `null`) → 403.
 * - Toda mutación DEBE traer la cookie `facy.csrf_token` (H3, spec §8.3/§12.2).
 *   Sin cookie (primer contacto de un cliente que no la obtuvo antes) → 403
 *   con el código genérico `forbidden`; el middleware global `ensureCsrfToken`
 *   emite la cookie en las respuestas para que el cliente la obtenga en un
 *   GET previo y reintente con el header.
 * - Exige el header `x-csrf-token` con el MISMO valor de la cookie
 *   (comparación en tiempo constante) → 403 si ausente/erróneo.
 *
 * Desvío registrado: Better Auth v1.7.7 NO emite la cookie
 * `better-auth.csrf_token` del borrador (§8.3) — protege por validación de
 * Origin + Fetch Metadata. Se implementa doble envío con cookie propia
 * `facy.csrf_token` para cumplir la matriz de §12.2.
 *
 * @param trustedOrigins - Orígenes permitidos (whitelist CORS).
 * @returns Middleware de Hono.
 */
export function csrf(trustedOrigins: string[]): MiddlewareHandler {
  return async (c, next) => {
    const method = c.req.method;
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      await next();
      return;
    }

    const origin = c.req.header("origin");
    if (origin && (origin === "null" || !trustedOrigins.includes(origin))) {
      throw new ForbiddenError("Origen no permitido");
    }

    const cookieToken = getCookie(c, CSRF_COOKIE_NAME);
    if (!cookieToken) {
      // Sin cookie CSRF la mutación no es verificable: se rechaza. El
      // cliente debe obtener la cookie (GET previo) y reenviar el header.
      throw new ForbiddenError("Token CSRF requerido");
    }
    const headerToken = c.req.header(CSRF_HEADER_NAME);
    if (!headerToken || !safeEqual(headerToken, cookieToken)) {
      throw new ForbiddenError("Token CSRF inválido");
    }

    await next();
  };
}

/**
 * Garantiza que el cliente tenga la cookie de doble envío CSRF.
 *
 * Si la cookie `facy.csrf_token` no existe, se genera un token aleatorio
 * (32 bytes) y se emite con `httpOnly: false` (el frontend debe leerlo para
 * enviarlo en el header `x-csrf-token`), `SameSite=Lax`, `Secure` en
 * producción y `Path=/`.
 *
 * @param env - Entorno tipado (producción → cookie Secure).
 * @returns Middleware de Hono.
 */
export function ensureCsrfToken(env: Env): MiddlewareHandler {
  return async (c, next) => {
    if (!getCookie(c, CSRF_COOKIE_NAME)) {
      const token = randomBytes(32).toString("hex");
      setCookie(c, CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        path: "/",
      });
    }
    await next();
  };
}