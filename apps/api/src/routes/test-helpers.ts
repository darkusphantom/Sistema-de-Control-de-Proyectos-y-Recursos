import type { Hono } from "hono";
import { createApp } from "../app";
import { parseEnv } from "../config/env";
import type { Env } from "../config/env";
import { MemoryUserStore } from "../infrastructure/repositories/in-memory/user-store";

/**
 * Construye un entorno de prueba válido para rutas (incluye auth/rate-limit).
 */
export function buildTestEnv(overrides: Record<string, string> = {}): Env {
  return parseEnv({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    BETTER_AUTH_SECRET:
      "test-secret-0123456789abcdef0123456789abcdef-abcdef",
    BETTER_AUTH_URL: "http://localhost:3001",
    RATE_LIMIT_MAX: "100",
    RATE_LIMIT_WINDOW_MS: "60000",
    ...overrides,
  });
}

/**
 * Construye una app de prueba con un store limpio por test.
 */
export function buildApp(
  overrides: Record<string, string> = {},
): { app: Hono; store: MemoryUserStore; env: Env } {
  const env = buildTestEnv(overrides);
  const store = new MemoryUserStore();
  const app = createApp({ env, store });
  return { app, store, env };
}

/**
 * Parsea las cabeceras `Set-Cookie` de una respuesta a un mapa nombre → valor.
 */
export function parseSetCookie(headers: Headers): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const entry of headers.getSetCookie()) {
    const pair = entry.split(";")[0];
    const index = pair.indexOf("=");
    if (index > 0) {
      cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
    }
  }
  return cookies;
}

/**
 * Tarro de cookies para simular el navegador en los tests de ruta.
 */
export class CookieJar {
  private readonly cookies = new Map<string, string>();

  /**
   * Captura las `Set-Cookie` de una respuesta.
   *
   * @param response - Respuesta HTTP.
   */
  capture(response: Response): void {
    for (const [name, value] of parseSetCookie(response.headers)) {
      this.cookies.set(name, value);
    }
  }

  /**
   * Devuelve el header `Cookie` serializado del tarro.
   *
   * @returns Header `Cookie` o `""` si está vacío.
   */
  header(): string {
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  /**
   * Lee una cookie del tarro.
   *
   * @param name - Nombre de la cookie.
   * @returns Valor, o `undefined`.
   */
  get(name: string): string | undefined {
    return this.cookies.get(name);
  }
}

/**
 * Obtiene la cookie de doble envío CSRF del cliente.
 *
 * Llama a `GET /api/v1/auth/session` (que la emite vía `ensureCsrfToken`
 * aunque responda 401 sin sesión) y devuelve el token.
 *
 * @param app - App Hono.
 * @returns Token CSRF, o `""` si no se emitió.
 */
export async function obtainCsrfToken(app: Hono): Promise<string> {
  const jar = new CookieJar();
  jar.capture(await app.request("/api/v1/auth/session"));
  return jar.get("facy.csrf_token") ?? "";
}

/** Carga JSON de una respuesta con forma segura. */
export async function jsonOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

/**
 * Registra un usuario a través de las rutas reales y devuelve el tarro de
 * cookies con la sesión y el CSRF.
 *
 * @param app  - App Hono.
 * @param body - Cuerpo de registro (se completan defaults si faltan).
 * @param options - Opciones (IP para rate limit).
 * @returns Tarro de cookies listo para peticiones autenticadas.
 */
export async function registerUser(
  app: ReturnType<typeof buildApp>["app"],
  body: Record<string, unknown>,
  options: { ip?: string } = {},
): Promise<CookieJar> {
  const jar = new CookieJar();
  if (!jar.get("facy.csrf_token")) {
    jar.capture(await app.request("/api/v1/auth/session"));
  }
  const csrf = jar.get("facy.csrf_token") ?? "";
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-csrf-token": csrf,
  };
  if (jar.header()) headers.cookie = jar.header();
  if (options.ip) headers["x-forwarded-for"] = options.ip;
  const response = await app.request("/api/v1/auth/register", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  jar.capture(response);
  if (response.status !== 201) {
    throw new Error(
      `registerUser falló (${response.status}): ${await response.text()}`,
    );
  }
  return jar;
}

/**
 * Convierte a un usuario del store en el rol indicado (para tests de
 * enforcement).
 *
 * @param store    - Store compartido.
 * @param username - Username del usuario.
 * @param role     - Rol a asignar (p. ej. `admin_sistema`).
 */
export function promoteToRole(
  store: ReturnType<typeof buildApp>["store"],
  username: string,
  role: "coordinador" | "aprobador" | "admin_sistema",
): void {
  const stored = store.userByUsername(username);
  if (stored) store.saveUser({ ...stored, role });
}