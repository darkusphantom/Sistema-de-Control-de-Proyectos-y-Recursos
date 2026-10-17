import type { Hono } from "hono";
import type { RouteDeps } from "./route-deps";

/** Esquema de seguridad de OpenAPI: `{ scheme: [] }` (apiKey en cookie/header). */
type SecurityRequirement = Record<string, string[]>;

/** Forma mínima del documento OpenAPI 3.1 que servimos. */
export type OpenApiDocument = {
  openapi: string;
  info: { title: string; version: string; description: string };
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
  };
  paths: Record<string, unknown>;
};

/**
 * Documento OpenAPI 3.1 de la API (requisito R17).
 *
 * Solo formas wire (`UserOption`, `Session`, `User`) y
 * cuerpos de petición; sin secretos, valores de env, rutas internas ni
 * esquemas de BD. La vía elegida es el **documento manual** (alternativa
 * aceptada por `api-structure.md` §10.1: "documento manual con
 * `Hono.openapi()` solo si se mantiene al día").
 *
 * Desvío registrado: se descartó la generación automática con el registry de
 * `@hono/zod-openapi`/`zod-to-openapi` porque su `extendZodWithOpenApi` muta el
 * prototipo de `ZodType` y con el dual-package de zod 4 (CJS/ESM) no es fiable
 * en el runner de Vitest (la mutación no siempre se comparte entre copias del
 * paquete). Se mantienen los esquemas zod wire de `validation.ts` como fuente
 * de verdad de las formas y el documento se mantiene sincronizado con ellos.
 */
export const openApiDocument: OpenApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Red FaCyT API",
    version: "v1",
    description:
      "API institucional de la Facultad Experimental de Ciencias y Tecnología. Contrato wire 1:1 con los tipos compartidos del frontend.",
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
      },
      csrfHeader: {
        type: "apiKey",
        in: "header",
        name: "x-csrf-token",
      },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error", "message"],
        properties: {
          error: { type: "string" },
          message: { type: "string" },
        },
      },
      UserOption: {
        type: "object",
        required: ["id", "username", "fullName"],
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          fullName: { type: "string" },
        },
      },
      Session: {
        type: "object",
        required: ["user", "expiresAt"],
        properties: {
          user: {
            type: "object",
            required: ["id", "username", "role"],
            properties: {
              id: { type: "string" },
              username: { type: "string" },
              role: { type: "string", enum: ["coordinador", "aprobador", "admin_sistema"] },
            },
          },
          expiresAt: { type: "string" },
        },
      },
      User: {
        type: "object",
        required: [
          "id",
          "username",
          "email",
          "givenName",
          "familyName",
          "role",
          "createdAt",
        ],
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          email: { type: "string" },
          givenName: { type: "string" },
          familyName: { type: "string" },
          role: { type: "string", enum: ["coordinador", "aprobador", "admin_sistema"] },
          createdAt: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/api/v1/auth/register": {
      post: {
        summary: "Registro público (solo crea coordinador)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["givenName", "familyName", "email", "password"],
                properties: {
                  givenName: { type: "string", minLength: 2, maxLength: 60 },
                  familyName: { type: "string", minLength: 2, maxLength: 60 },
                  email: { type: "string", format: "email", maxLength: 254 },
                  password: { type: "string", minLength: 8, maxLength: 128 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Sesión creada + cookie",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Session" },
              },
            },
          },
          ...errorResponses(),
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        summary: "Login por username",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", maxLength: 50 },
                  password: { type: "string", minLength: 1, maxLength: 128 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Sesión + cookie nueva",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Session" },
              },
            },
          },
          ...errorResponses(),
        },
      },
    },
    "/api/v1/auth/session": {
      get: {
        summary: "Sesión actual",
        security: sessionAuth(),
        responses: {
          200: {
            description: "Sesión wire",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Session" },
              },
            },
          },
          ...errorResponses(),
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        summary: "Cerrar sesión",
        security: mutationAuth(),
        responses: {
          204: { description: "Sesión invalidada" },
          ...errorResponses(),
        },
      },
    },
    "/api/v1/users/coordinadores": {
      get: {
        summary: "Opciones de coordinadores (sin email ni rol)",
        security: sessionAuth(),
        responses: {
          200: {
            description: "Lista de coordinadores",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/UserOption" },
                },
              },
            },
          },
          ...errorResponses(),
        },
      },
    },
    "/api/v1/users/{username}": {
      get: {
        summary: "Perfil público de usuario",
        security: sessionAuth(),
        parameters: [
          { name: "username", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Perfil de usuario",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["user"],
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          ...errorResponses(),
        },
      },
    },
    "/api/v1/admin/users/{id}/role": {
      patch: {
        summary: "Asignar rol (solo admin)",
        security: mutationAuth(),
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: {
                    type: "string",
                    enum: ["coordinador", "aprobador", "admin_sistema"],
                  },
                },
              },
            },
          },
        },
        responses: {
          204: { description: "Rol actualizado" },
          ...errorResponses(),
        },
      },
    },
  },
};

/** Seguridad requerida en rutas autenticadas por cookie. */
function sessionAuth(): SecurityRequirement[] {
  return [{ sessionCookie: [] }];
}

/**
 * Seguridad requerida en mutaciones autenticadas: cookie de sesión Y header
 * CSRF en el MISMO objeto (semántica AND de OpenAPI 3.1). No separarlos en dos
 * objetos equivaldría a "cualquiera de los dos" (OR), incorrecto.
 */
function mutationAuth(): SecurityRequirement[] {
  return [{ sessionCookie: [], csrfHeader: [] }];
}

/** Respuestas de error genéricas (400/401/403/404/409/429/413). */
function errorResponses(): Record<string, { description: string }> {
  return {
    400: { description: "Validación fallida" },
    401: { description: "Sin sesión o sesión inválida" },
    403: { description: "Prohibido por rol o propiedad" },
    404: { description: "No encontrado o no visible" },
    409: { description: "Conflicto (cuenta duplicada)" },
    429: { description: "Rate limit superado" },
    413: { description: "Cuerpo excesivo" },
  };
}

/**
 * Página HTML mínima de `/docs` (sin scripts externos; CSP estricta).
 * No expone variables de entorno (R17: sin valores de env en el documento).
 */
function docsPage(): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Red FaCyT API — Documentación</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #172033; background: #fff; }
  code { background: #f1f5f9; padding: 0.15rem 0.35rem; border-radius: 4px; }
</style>
</head>
<body>
  <h1>Red FaCyT API</h1>
  <p>Contrato wire 1:1 con <code>src/lib/types.ts</code>. Documentación OpenAPI 3.1.</p>
  <p>Especificación: <a href="/api/v1/openapi.json"><code>/api/v1/openapi.json</code></a></p>
</body>
</html>`;
}

/**
 * Monta el documento OpenAPI y la página de `/docs` si están habilitados.
 *
 * Bloqueado en producción o con `OPENAPI_ENABLED=false` (R17): las rutas no se
 * montan y caen en el 404 genérico de la app.
 *
 * @param app  - App Hono principal.
 * @param deps - Dependencias inyectadas (entorno).
 */
export function registerOpenApiRoutes(app: Hono, deps: RouteDeps): void {
  const { env } = deps;
  if (env.NODE_ENV === "production" || !env.OPENAPI_ENABLED) return;
  app.get("/api/v1/openapi.json", (c) => c.json(openApiDocument));
  app.get("/api/v1/docs", (c) => c.html(docsPage()));
}