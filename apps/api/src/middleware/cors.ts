import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

/**
 * Convierte y valida un CSV de orígenes en un arreglo canónico.
 *
 * Cada entrada debe ser un origen absoluto `http(s)://host[:puerto]` sin
 * usuario, ruta, query ni fragmento. Las entradas se normalizan a su
 * `origin` canónico y se deduplican, de modo que una configuración inválida
 * falla al arrancar y no en la primera petición con credenciales.
 *
 * Complejidad: O(n) con n = número de orígenes (config pequeña, una sola vez).
 *
 * @param csv - Cadena CSV de orígenes CORS.
 * @returns Orígenes canónicos, únicos y en orden de aparición.
 * @throws Error si alguna entrada no es un origen http(s) válido.
 */
export function parseCorsOrigins(csv: string): string[] {
  const origins = new Set<string>();
  for (const entry of csv.split(",")) {
    const value = entry.trim();
    if (!value) continue;
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`Invalid CORS origin: "${value}" is not a valid URL`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(
        `Invalid CORS origin: "${value}" must use http or https`,
      );
    }
    if (
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      throw new Error(
        `Invalid CORS origin: "${value}" must be an origin without path, query, credentials or fragment`,
      );
    }
    origins.add(url.origin);
  }
  return [...origins];
}

/**
 * CORS con whitelist estricta (requisito R1 de threat-model-api.md).
 *
 * Sin reflejo del header `Origin` y sin comodines: solo se permite un origen
 * exacto listado en `CORS_ORIGINS`. `Origin: null` se rechaza. Con
 * `credentials: true` para que las cookies de sesión funcionen entre el web
 * (3000) y la API (3001).
 *
 * La whitelist se resuelve a un `Set` una sola vez, así que cada request
 * cuesta O(1) en lugar de O(n) sobre el arreglo.
 *
 * @param csv - CSV de orígenes permitidos.
 * @returns Middleware de Hono.
 */
export function corsWhitelist(csv: string): MiddlewareHandler {
  const allowedOrigins = new Set(parseCorsOrigins(csv));
  return cors({
    origin: (origin) => {
      if (!origin || origin === "null") {
        return null;
      }
      return allowedOrigins.has(origin) ? origin : null;
    },
    credentials: true,
  });
}
