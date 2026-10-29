import { z } from "zod";

/**
 * Secreto de desarrollo documentado en `.env.example`.
 *
 * Se mantiene como default fuera de producción (ergonomía de `pnpm dev`) y
 * `parseEnv` lo rechaza explícitamente cuando `NODE_ENV=production`, de modo
 * que un despliegue con el valor de ejemplo no puede arrancar.
 */
export const DEV_AUTH_SECRET =
  "dev-only-insecure-secret-do-not-use-0123456789abcdef0123456789abcdef";

/**
 * Esquema zod del entorno de la API.
 *
 * Fail-fast: si una variable requerida falta o tiene un valor inválido,
 * `parseEnv` lanza un error y el proceso no arranca. Nunca hay defaults
 * silenciosos para valores que importan en producción (p. ej. `CORS_ORIGINS`,
 * `BETTER_AUTH_SECRET`). Fuera de producción los valores de auth/rate-limit
 * tienen defaults de desarrollo claramente inseguros y documentados.
 */
export const envSchema = z.object({
  /** Entorno de ejecución: cambia el error handler y las cookies Secure. */
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  /** Puerto HTTP de la API (el web vive en 3000; la API en 3001). */
  PORT: z.coerce.number().int().positive().default(3001),
  /** Interfaz de escucha del servidor. */
  HOST: z.string().min(1).default("0.0.0.0"),
  /** Whitelist estricta de orígenes CORS (CSV). Requerida en producción. */
  CORS_ORIGINS: z.string().trim().min(1).default("http://localhost:3000"),
  /** Límite global del cuerpo de petición en bytes. */
  MAX_BODY_BYTES: z.coerce.number().int().positive().default(102_400),
  /** Nivel de log para pino. */
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
    .default("info"),
  /** Cadena de conexión a PostgreSQL (futuro). */
  DATABASE_URL: z.string().optional(),
  /** Secreto de firma de sesiones de Better Auth (≥ 32 bytes). */
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .default(DEV_AUTH_SECRET),
  /** URL pública de la API para Better Auth. */
  BETTER_AUTH_URL: z.string().min(1).default("http://localhost:3001"),
  /** Máximo de peticiones por ventana de rate limit. */
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  /** Duración de la ventana de rate limit en milisegundos. */
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  /**
   * Habilita el documento OpenAPI (`/openapi.json`, `/docs`).
   *
   * Default `false`: la documentación se expone solo si se pide de forma
   * explícita, nunca por olvido en un despliegue.
   */
  OPENAPI_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

/**
 * Entorno tipado resultante de `parseEnv`.
 */
export type Env = z.infer<typeof envSchema>;

/** Claves requeridas solo cuando `NODE_ENV=production` (R5). */
const REQUIRED_IN_PRODUCTION: string[] = [
  "CORS_ORIGINS",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "RATE_LIMIT_MAX",
  "RATE_LIMIT_WINDOW_MS",
];

/**
 * Parsea el entorno de proceso con zod y falla rápido ante valores inválidos.
 *
 * Complejidad: O(k) con k = número de claves del esquema (constante).
 *
 * @param source - Fuente de variables (normalmente `process.env`).
 * @returns Entorno tipado con los defaults aplicados.
 * @throws Error si `NODE_ENV=production` y falta una clave requerida, o si
 *         alguna variable no cumple el esquema.
 */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  if (source.NODE_ENV === "production") {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (source[key] === undefined) {
        throw new Error(
          `Invalid environment: ${key} is required when NODE_ENV=production`,
        );
      }
    }
    // Definido pero inseguro es peor que ausente: el secreto de ejemplo es
    // público (está en el repo) y permitiría firmar sesiones falsas.
    if (source.BETTER_AUTH_SECRET === DEV_AUTH_SECRET) {
      throw new Error(
        "Invalid environment: BETTER_AUTH_SECRET must not be the documented development secret in production",
      );
    }
  }
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }
  return result.data;
}