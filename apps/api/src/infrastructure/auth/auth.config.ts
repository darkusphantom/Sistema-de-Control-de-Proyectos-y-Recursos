import { betterAuth } from "better-auth";
import type { Env } from "../../config/env";
import { parseCorsOrigins } from "../../middleware/cors";
import { MemoryUserStore } from "../repositories/in-memory/user-store";
import { memoryAdapter } from "./memory-auth-adapter";

/** Expiración de sesión: 24 horas (en segundos), contrato R13. */
const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24;

/** Renovación deslizante (sliding): cada 8 horas, contrato R13. */
const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 8;

/**
 * Factoría de Better Auth (api-structure.md §8.2).
 *
 * Sesiones con expiración 24 h y renovación deslizante cada 8 h; cookies
 * `httpOnly` + `SameSite=Lax` + `Secure` (producción) + `Path=/`. El rol vive
 * en `additionalFields` con `input: false` y `defaultValue: "coordinador"`: el
 * registro público solo crea coordinadores (R12; pivot-project.md §7).
 *
 * Desvíos registrados contra Better Auth v1.7.7 (la versión instalada):
 * - **Sesiones de BD, NO stateless JWT (hallazgo H4)**: se confirmó en el
 *   código instalado que Better Auth v1.7.7 NO soporta sesiones totalmente
 *   stateless. La opción `session.cookieCache.strategy: "jwt"` solo cachea la
 *   sesión en una cookie; la validación SIEMPRE consulta el registro de sesión
 *   en la BD (`getSessionFromDatabase`), por lo que sin un secondary storage
 *   no hay vía "sin BD". Se mantiene la sesión de BD en memoria (revocable,
 *   más segura: un logout/democión es efectivo de inmediato) y se registra
 *   como desvío formal: la afirmación "stateless JWT" de `auth.md` §8.2 no
 *   aplica en esta versión; el modelo de amenaza se actualizará.
 * - **Hashing**: se mantiene el **Scrypt** por defecto del proveedor
 *   (N=16384, r=16, p=1, dkLen=64, sal de 16 bytes, normalización NFKC),
 *   en lugar de argon2id/bcrypt de la spec. Scrypt es un KDF memory-hard de la
 *   misma familia que argon2id, cumple el requisito de seguridad de `auth.md`
 *   §11.2 y evita dependencias nativas. Los señuelos anti-timing (H5) usan
 *   exactamente estos parámetros.
 * - **`database`**: la spec (§8.2) usa `database: { adapter }`, la forma de
 *   Better Auth v0.x. En v1.7.7 `database` es la función adaptadora
 *   (`DBAdapterInstance`) directamente: `database: memoryAdapter(store)`. La
 *   forma `{ adapter }` no se reconoce y cae al adaptador Kysely.
 * - **`basePath`**: se fija `/api/v1/auth` para las rutas wire (`auth.api.*`).
 *   No se monta el handler nativo (`auth.handler`) en la API (hallazgo H1).
 * - **`advanced.database.validateSchema: false`**: el adaptador en memoria no
 *   tiene esquema que validar.
 *
 * @param env   - Entorno tipado (secret, baseURL, CORS).
 * @param store - Store compartido (fuente única de verdad).
 * @returns Instancia de Better Auth tipada con los `additionalFields`.
 */
export function createAuth(env: Env, store: MemoryUserStore) {
  const isProduction = env.NODE_ENV === "production";
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/v1/auth",
    trustedOrigins: parseCorsOrigins(env.CORS_ORIGINS),
    database: memoryAdapter(store),
    session: {
      expiresIn: SESSION_EXPIRES_IN_SECONDS,
      updateAge: SESSION_UPDATE_AGE_SECONDS,
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    user: {
      additionalFields: {
        username: { type: "string", input: true, required: true },
        givenName: { type: "string", input: true, required: true },
        familyName: { type: "string", input: true, required: true },
        role: {
          type: "string",
          input: false,
          required: true,
          defaultValue: "coordinador",
        },
      },
    },
    advanced: {
      useSecureCookies: isProduction,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        path: "/",
      },
      database: { validateSchema: false },
    },
  });
}

/**
 * Tipo de la instancia de Better Auth construida por `createAuth`.
 *
 * Captura el `Auth<Options>` específico (incluye los `additionalFields` en los
 * tipos de `auth.api.*`); el tipo base `Auth` de better-auth pierde esa
 * inferencia y no es asignable a la instancia concreta.
 */
export type AppAuth = ReturnType<typeof createAuth>;