# Arquitectura de la API — Red FaCyT (`apps/api`)

Guía de implementación del scaffold inicial de la API de Red FaCyT como aplicación separada del monorepo pnpm (`apps/api`). Define la **estructura objetivo** y las decisiones de stack para que el `developer` implemente el scaffold sin ambigüedad y para que la API crezca hacia Better Auth + PostgreSQL + repositorios hexagonales **sin rework**.

> **Estado**: documento de diseño (fase de diseño, agente `security-architect`). El estado real de implementación vive en `docs/architecture/progress.md` (dinámico). Este documento NO es inmutable como `frontend-structure.md`, pero solo cambia por revisión de arquitectura. **Extendido el 2026-10-03** para la entrega de **auth (Better Auth en memoria) + endpoints `/api/v1/*` (auth, posts, feed, usuarios, admin) + documentación OpenAPI** (§8–§12); la parte del scaffold (§1–§7, §13–§15) queda como se entregó.

Referencias obligatorias:

- [`../security/crown-jewels.md`](../security/crown-jewels.md) — joyas de la corona (P0/P1/P2) y controles obligatorios.
- [`../security/threat-model-api.md`](../security/threat-model-api.md) — modelo de amenaza de la superficie API (emitido junto a este documento).
- [`frontend-structure.md`](frontend-structure.md) — arquitectura frontend (inmutable): el contrato que la API debe cumplir.
- [`../design/auth.md`](../design/auth.md) §4, §10.2 y §11.2 — validación, roles y contrato de seguridad de la transición al backend.
- [`../../src/lib/repositories/post-repository.ts`](../../src/lib/repositories/post-repository.ts) — interfaces hexagonales `PostRepository` / `UserRepository`.
- [`../../src/lib/types.ts`](../../src/lib/types.ts) — tipos compartidos `Post`, `PostFilters`, `Session`, `User`, `AuthorOption`, `UserRole`, etc.
- [`../../src/lib/visibility.ts`](../../src/lib/visibility.ts) — regla de visibilidad del feed (`canViewPost`, `filterVisiblePosts`) que la API debe **replicar en servidor**.
- [`../../src/lib/filters.ts`](../../src/lib/filters.ts) — `toSearchParams`/`fromSearchParams`: **nombres wire de los query params del feed** (`q`, `categoria`, `tipo`, `autor`, `estado`, `desde`, `hasta`).
- [`../implementation/implementation_base.md`](../implementation/implementation_base.md) — alcance MVP.

---

## 1. Propósito y alcance del scaffold

El objetivo de este entregable (scaffold) fue crear la **estructura inicial** de la API en `apps/api`, lista para crecer hacia auth, base de datos y endpoints de negocio **sin rework**. El scaffold **no** implementó (se entrega por fases):

- Endpoints de negocio (feed, publicaciones, perfiles, admin).
- Conexión a PostgreSQL.
- Better Auth / sesiones reales.
- CORS *abierto* ni headers sin política definida.

Sí creó la **base verificable**: patrón `createApp`, configuración de entorno tipada y estricta, middleware de seguridad (CORS whitelist, security headers, body limit, error handler sin fuga, 404 JSON), endpoint de salud (`GET /api/v1/health`), puertos hexagonales espejo del contrato frontend y configuración Vitest/tsconfig con umbral ≥ 80%.

> **Alcance de esta entrega** (auth + endpoints + OpenAPI, siempre **en memoria**, migrable a PostgreSQL sin rework): Better Auth v1.x con sesiones stateless (JWT) y adaptador en memoria (§8); endpoints `/api/v1/*` de auth, posts/feed, usuarios y admin con validación `zod` y enforcement por rol/propietario en servidor (§9); documentación OpenAPI sin fuga, bloqueada en producción (§10); estructura `infrastructure/repositories/in-memory/` + `application/` (casos de uso que inyectan puertos) (§11); verificación y Definition of Done (§12).

Regla de idioma del equipo: **código en inglés** (identificadores, archivos), **documentación/comentarios en español**.

---

## 2. Stack y decisiones (justificadas)

| Decisión | Elección | Justificación |
| --- | --- | --- |
| Framework | **Hono 4** | Minimalista, TypeScript nativo, middleware-first, ecosistema de seguridad oficial (`@hono/secure-headers`, `hono/body-limit`, `hono/cors`), y factoría `Hono` pura que se testea sin abrir puertos (`app.request()`). Decisiones ya tomadas por el equipo, se documentan. |
| Servidor HTTP | **`@hono/node-server`** | Adapter estándar de Node para Hono. Solo se importa en el bootstrap (`src/index.ts` / `server.ts`), nunca en `app.ts`, para que `createApp` siga siendo puro y testable. |
| Lenguaje | **TypeScript 5** (strict) | Mismo estándar que el web. El contrato frontend está tipado; el backend debe verificar los mismos tipos en servidor. |
| Validación de entorno y de request | **`zod`** | Estándar del ecosistema Hono (`@hono/zod-validator`). La validación de entorno (env) es estricta y *fail-fast*; la de request llega con los endpoints. |
| Seguridad de cabeceras | **`@hono/secure-headers`** | Middleware oficial de Hono (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`). Evita implementación casera. |
| Rate limiting | **`hono-rate-limiter`** (MemoryStore) | Cuando llegue auth. En el scaffold se define el **slot** (middleware + claves de env), sin lógica de negocio. Un store en memoria es suficiente para el MVP; se puede migrar a Redis sin cambiar el middleware. |
| Logging | **`pino` + `pino-http`** | Logging estructurado, sin PII ni credenciales (requisito P2 de `crown-jewels.md`). |
| Dev / build | **`tsx watch`** (dev), **`tsup`** (build ESM) | `tsx` ejecuta TS en Node sin build; `tsup` produce un bundle ESM limpio para producción. Alternativa al `next build` del web. |
| Tests | **Vitest 5** (entorno `node`) + `@vitest/coverage-v8` | Mismo runner y umbral que el web (≥ 80% líneas, funciones, ramas, sentencias). Entorno `node`, no `jsdom`. |
| Lint | **ESLint 9** (flat config, `typescript-eslint`) | Mismo major que el web; config independiente del web (el web usa `eslint-config-next`, que no aplica a Node). |
| Auth | **Better Auth v1.x** (sesiones stateless JWT + adaptador en memoria) | Proveedor maduro con `additionalFields`, cookies seguras, CSRF y handler compatible con Hono. **En memoria** por decisión del equipo (MVP), migrable a PostgreSQL sin rework (§8). |
| Documentación API | **`@hono/zod-openapi`** (+ opcional `@hono/swagger-ui`) | Genera OpenAPI 3.1 desde los esquemas `zod` ya obligatorios; evita duplicar la spec a mano (§10). |
| Hashing de contraseñas | **argon2id** (o bcrypt coste ≥ 12), vía configuración del proveedor | Cumple `auth.md` §11.2 y joya P0 credenciales (`crown-jewels.md`). Ruta de opción confirmada contra la versión fijada (§8.2). |

**Dependencias mínimas del scaffold** (dev): `typescript`, `vitest`, `@vitest/coverage-v8`, `tsx`, `tsup`, `eslint`, `typescript-eslint`, `@types/node`. (runtime): `hono`, `@hono/node-server`, `@hono/secure-headers`, `zod`, `pino`, `pino-http`. Versiones a fijar por el `developer` con las compatibles a Hono 4 y Vitest 5.

---

## 3. Estructura de carpetas objetivo de `apps/api`

```
apps/api/
├── package.json                 → name: "@red-facyt/api", type: "module", scripts (ver §13)
├── tsconfig.json                → strict, sin emit (typecheck); build vía tsup
├── vitest.config.mts            → entorno node, umbral ≥ 80%, exclude de tests
├── eslint.config.mjs            → flat config con typescript-eslint
├── .env.example                 → claves sin valores reales (NUNCA secretos)
└── src/
    ├── index.ts                 → bootstrap: parseEnv + serve(@hono/node-server)   [scaffold]
    ├── server.ts                → createServer(): arranca app y escucha              [scaffold]
    ├── app.ts                   → createApp(options): devuelve Hono (puro, testable) [scaffold]
    ├── app.test.ts              → smoke: /health 200, 404 JSON, headers, CORS        [scaffold]
    ├── config/
    │   ├── env.ts               → parseEnv() con zod, fail-fast                      [scaffold]
    │   └── env.test.ts          → valida defaults y fallos                            [scaffold]
    ├── middleware/              → middleware reutilizable de seguridad
    │   ├── security-headers.ts  → @hono/secure-headers (CSP, HSTS, nosniff, RP)      [scaffold]
    │   ├── cors.ts              → whitelist estricta desde env (sin reflejo)         [scaffold]
    │   ├── body-limit.ts        → límite global de cuerpo JSON                       [scaffold]
    │   ├── error-handler.ts     → onError → JSON genérico sin stack (prod)          [scaffold]
    │   ├── not-found.ts         → 404 JSON                                          [scaffold]
    │   ├── request-id.ts        → x-request-id para trazabilidad segura              [scaffold]
    │   ├── rate-limit.ts        → slot para hono-rate-limiter (config por ruta)      [esta entrega: auth]
    │   ├── require-session.ts   → identidad por cookie + rol fresco del store        [esta entrega]
    │   ├── require-role.ts      → 403 si el rol no está permitido                    [esta entrega]
    │   └── csrf.ts              → doble envío x-csrf-token en mutaciones             [esta entrega]
    ├── domain/                  → puertos hexagonales (espejo del contrato frontend + extensiones de escritura API)
    │   ├── post.ts              → Post, PostFilters, PostPage, PageOptions, PostRepository [scaffold + escritura API]
    │   ├── user.ts              → User, UserRole, AuthorOption, UserRepository       [scaffold + extensiones API]
    │   ├── session.ts           → Session                                            [scaffold]
    │   └── validation.ts        → esquemas zod compartidos (auth, posts, feed, admin) [esta entrega]
    ├── application/             → casos de uso / servicios (inyectan puertos)
    │   ├── auth/                → register/signIn/getSession/signOut (Better Auth)    [esta entrega]
    │   ├── posts/               → getFeed/getPost/createPost/updatePost/deletePost    [esta entrega]
    │   ├── users/               → listAuthors/getProfile                              [esta entrega]
    │   └── admin/               → setUserRole/setPostVisibility                       [esta entrega]
    ├── routes/                  → handlers HTTP de los endpoints /api/v1/*            [esta entrega]
    │   ├── auth.routes.ts       → register/login/session/logout
    │   ├── posts.routes.ts      → feed + CRUD
    │   ├── users.routes.ts      → /users/authors, /users/:username
    │   ├── admin.routes.ts      → /admin/users/:id/role, /admin/posts/:id/visibility
    │   └── openapi.ts           → documento OpenAPI + /openapi.json, /docs
    └── infrastructure/          → adaptadores de los puertos
        ├── repositories/
        │   ├── in-memory/       → user-store + InMemoryPostRepository / InMemoryUserRepository [esta entrega: contract tests]
        │   └── postgres/        → PostgresPostRepository / PostgresUserRepository    [futuro]
        └── auth/                → auth.config.ts + memory-auth-adapter + auth.hono.ts [esta entrega]
```

**Leyenda:** `[scaffold]` = se creó en la tarea del scaffold · `[esqueleto]` = interfaz/port vacío o slot (sin lógica de negocio) · `[esta entrega]` = llega con auth + endpoints `/api/v1/*` + OpenAPI · `[futuro]` = llega con PostgreSQL.

Convenciones (mismas del web, `frontend-structure.md` §2):

- **Colocation de tests**: `module.ts` → `module.test.ts` en la misma carpeta.
- **JSDoc** obligatorio en toda función/método público.
- **Código en inglés** (identificadores, nombres de archivo); **comentarios y doc en español**.
- **Interfaces hexagonales en `domain/`**: espejo fiel de `src/lib/repositories/` y `src/lib/types.ts` (ver §6). La API *implementa* estos puertos; el frontend no cambia.

---

## 4. Entry point y patrón `createApp` (testabilidad)

La clave de testabilidad: **`createApp` es una función pura que devuelve una instancia `Hono`**; solo el bootstrap abre el puerto. Los tests llaman `app.request(path, init)` sin servidor.

### 4.1 `src/app.ts`

```ts
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { Env } from "./config/env";
import { securityHeaders } from "./middleware/security-headers";
import { corsWhitelist } from "./middleware/cors";
import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";
import { requestId } from "./middleware/request-id";
import { rateLimitSkeleton } from "./middleware/rate-limit";

/** Opciones de creación de la app: entorno tipado + (a futuro) puertos. */
export type AppOptions = {
  env: Env;
  // A futuro, sin romper la firma:
  // postRepository?: PostRepository;
  // userRepository?: UserRepository;
  // authHandler?: Hono;            // adapter de Better Auth
};

/** Crea la app Hono con el pipeline de seguridad del scaffold. */
export function createApp(options: AppOptions): Hono {
  const app = new Hono();
  const { env } = options;

  app.use("*", requestId());
  app.use("*", securityHeaders());
  app.use("*", corsWhitelist(env.CORS_ORIGINS));
  app.use("*", bodyLimit({ maxSize: env.MAX_BODY_BYTES, onError: () => new Response("Body too large", { status: 413 }) }));
  app.use("*", rateLimitSkeleton(env)); // P0 cuando llegue auth; hoy define el slot

  app.get("/api/v1/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

  app.notFound(notFound);
  app.onError(errorHandler);
  return app;
}
```

> **Comentario sobre el ejemplo**: es una ilustración del contrato de firma, no código final; el `developer` implementa en TDD (test primero) y ajusta detalles. El punto de arquitectura es que los middlewares de seguridad se aplican **antes** de las rutas y que `createApp` no conoce el servidor.

### 4.2 `src/server.ts` (arranque, separado de la app)

```ts
import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { parseEnv } from "./config/env";

/** Arranca el servidor HTTP. Usado solo por index.ts (no por los tests). */
export function createServer(envSource: NodeJS.ProcessEnv) {
  const env = parseEnv(envSource); // fail-fast si falta una variable requerida
  const app = createApp({ env });
  return serve({ fetch: app.fetch, port: env.PORT, hostname: env.HOST });
}
```

### 4.3 `src/index.ts`

```ts
import { createServer } from "./server";

createServer(process.env);
```

El scaffold puede incluir un handler de apagado limpio (`SIGTERM`/`SIGINT`) que cierre el server — se documenta como mejora P2.

### 4.4 Testabilidad (verificación)

- Los tests construyen `createApp({ env: testEnv })` con un env de prueba y llaman `app.request("/api/v1/health")` → 200.
- `app.test.ts` verifica además: 404 JSON, cabeceras de seguridad presentes, CORS con `Origin` permitido y denegado, `413` con cuerpo excesivo, y que los errores no filtran stack.
- `@hono/node-server` **no** se importa en `app.ts` (solo en `server.ts`/`index.ts`), de modo que los tests nunca abren puertos.

---

## 5. Configuración de entorno (env) y secretos

`src/config/env.ts` parsea `process.env` con `zod`. Reglas (alineadas con `crown-jewels.md` P1 secretos):

- **Fail-fast**: si falta una variable requerida (p. ej. `CORS_ORIGINS` en `NODE_ENV=production`), `parseEnv` lanza error y el proceso no arranca. Nunca defaults silenciosos para secretos.
- **`.env.example`** con claves y comentarios, **sin valores reales**. `.gitignore` raíz ya ignora `.env*` salvo `.env.example` (verificado).
- **Sin secretos en el scaffold** (no hay DB ni auth aún), pero el esquema ya reserva las claves futuras (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) como `optional` hasta que existan, para que el contrato de config no cambie.

Claves del scaffold:

| Clave | Tipo | Default | Requerida | Nota |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | `development \| production \| test` | `development` | no | Cambia el comportamiento del error handler (stack solo en dev). |
| `PORT` | number | `3001` | no | El web vive en 3000; la API en 3001. |
| `HOST` | string | `0.0.0.0` | no | |
| `CORS_ORIGINS` | string (CSV) | `http://localhost:3000` | **sí en production** | Whitelist estricta, sin reflejo de `Origin`. |
| `MAX_BODY_BYTES` | number | `102_400` (100 KB) | no | Límite global; rutas con multipart (uploads) lo ajustarán. |
| `LOG_LEVEL` | string | `info` | no | Para `pino`. |

Futuras (cuando existan): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`.

---

## 6. Contrato hexagonal con el frontend (sin rework)

La API debe cumplir a futuro las interfaces de `src/lib/repositories/post-repository.ts` y los tipos de `src/lib/types.ts`. Como el frontend es una app Next.js en la raíz y la API es otro workspace (`apps/*`), **no comparten import de TypeScript**; el contrato se materializa en dos planos:

1. **Puertos espejo** en `apps/api/src/domain/*` con las mismas firmas (`findVisible(filters, page, session): Promise<PostPage>`, `findById(id): Promise<Post | null>`, `listAuthors(): Promise<AuthorOption[]>`), en inglés. Los adaptadores (`infrastructure/repositories/postgres/`) los implementan; los *use cases* (`application/`) los inyectan.
2. **Formato wire (JSON)** documentado aquí como **fuente de verdad** del intercambio. Ambos lados (frontend web y API) mapean hacia/desde este JSON. `frontend-structure.md` es inmutable y no se toca: es el frontend quien ya consume estas formas.

Formas wire (deben coincidir 1:1 con `src/lib/types.ts`):

- `Post`: `{ id, title, content, authorId, category, type, visibility, publishedAt, createdAt, updatedAt, imageUrl }`.
- `PostPage`: `{ items: Post[], total: number }` (de `post-repository.ts`).
- `AuthorOption`: `{ id, username, fullName }`.
- `Session`: `{ user: { id, username, role }, expiresAt }`.
- `User`: `{ id, username, email, givenName, familyName, role, createdAt }`.

**Cómo se garantiza sin rework** (verificación):

- Contract tests del API (cuando existan endpoints): fixtures con las mismas formas que `src/data/*` y asserts sobre el JSON devuelto.
- Los filtros del feed se transmiten como query params con los **nombres wire que emite el frontend** (`toSearchParams`/`fromSearchParams` de `src/lib/filters.ts`): `q`, `categoria`, `tipo`, `autor`, `estado`, `desde`, `hasta`, más paginación `limit`/`offset` (el frontend usa `limit` creciente + `offset 0` para "Cargar más"; la API debe aceptar ese patrón). Los nombres ingleses (`keyword`, `category`, …) son **campos internos** de `PostFilters`, no params wire. **Corrección de contrato**: la versión inicial de este documento listaba nombres ingleses; el frontend real serializa en español, así que la API acepta los nombres wire de `filters.ts` (desvío registrado en `progress.md`). Detalle y esquema zod en §9.3.
- Cualquier desvío de contrato se registra en `progress.md` (como ya ocurrió con `findAll→findVisible`).

---

## 7. Mapa de endpoints (coherente con el contrato frontend)

Prefijo de versión **`/api/v1`**. La versión protege el contrato del frontend cuando la API evolucione. Las filas marcadas `(futuro)` no son parte de esta entrega; el resto se especifica en detalle en **§9**.

| Contrato frontend (método) | Ruta API | Método | Acceso | Request | Respuesta |
| --- | --- | --- | --- | --- | --- |
| `authGateway.signIn(username, password)` | `/api/v1/auth/login` | POST | público | `{ username, password }` | `Session` + cookie `httpOnly; Secure; SameSite` |
| `authGateway.signUp(givenName, familyName, email, password)` | `/api/v1/auth/register` | POST | público | `{ givenName, familyName, email, password }` | `Session` + cookie |
| `authGateway.getSession()` | `/api/v1/auth/session` | GET | sesión (cookie) | — | `Session` o 401 |
| `authGateway.signOut()` | `/api/v1/auth/logout` | POST | sesión | — | 204 (invalida cookie) |
| `postRepo.findVisible(filters, page, session)` | `/api/v1/posts` | GET | sesión | query: `q, categoria, tipo, autor, estado, desde, hasta, limit, offset` (ver §9.3) | `PostPage` |
| `postRepo.findById(id)` | `/api/v1/posts/:id` | GET | sesión | — | `Post` o 404 |
| crear publicación | `/api/v1/posts` | POST | sesión | `PostDraft` (sin `authorId`: lo toma de la sesión) | `Post` (201) |
| editar publicación | `/api/v1/posts/:id` | PATCH | autor/admin | `PostDraft` parcial | `Post` |
| eliminar publicación | `/api/v1/posts/:id` | DELETE | autor/admin | — | 204 |
| `userRepo.listAuthors()` | `/api/v1/users/authors` | GET | sesión | — | `AuthorOption[]` |
| perfil `/profile/[username]` | `/api/v1/users/:username` | GET | sesión | — | `User` (público limitado) + sus `Post[]` visibles |
| admin: asignar rol | `/api/v1/admin/users/:id/role` | PATCH | solo `admin` | `{ role }` | 204 |
| admin: moderar publicación | `/api/v1/admin/posts/:id/visibility` | PATCH | solo `admin` | `{ visibility: "publicado" \| "oculto" }` | `Post` |
| subida de imagen (futuro) | `/api/v1/uploads` | POST | sesión | multipart | `{ imageUrl }` |

Restricciones transversales del mapa (requisitos de `threat-model-api.md`, verificación en ese documento):

- **Enforcement server-side** por rol/propietario en cada ruta (joya P0 acceso) — nunca confiar en el rol del cliente.
- Los endpoints de auth (`login`/`register`) llevan **rate limiting** (joya P0 credenciales).
- Toda ruta valida entrada con `zod` (joya P1 API); el cliente no es control de acceso, solo UX (`auth.md` §11.2).
- Errores JSON sin fuga (`error-handler`), 404 JSON, límite de cuerpo global.
- Especificación detallada de cada ruta (esquemas zod, respuestas wire 1:1, enforcement por rol/propietario): **§9**.

---

## 8. Autenticación — Better Auth (en memoria, sesiones stateless JWT)

Decisión del equipo (contexto técnico verificado): el MVP autentica con **Better Auth v1.x sin base de datos**, con **sesiones stateless (JWT firmado)** y un **adaptador en memoria** para los modelos de Better Auth (`user`, `session`, `account`, `verification`). El paso a PostgreSQL (fase 2) cambia el adaptador y el modo de sesión, **no** las rutas ni los casos de uso (`application/`).

### 8.1 Modelo de identidad y roles

- Identificador de acceso: **`username`** (login por usuario, `docs/design/auth.md` §10.1). El correo es identidad de contacto y de unicidad.
- **Unicidad**: `username` y `email` únicos (en memoria, por mapa; en PostgreSQL, índice único sobre `lower(username)` y `lower(email)`, `auth.md` §11.2).
- **El rol no es entrada del cliente**: `role` se declara en `additionalFields` con `input: false` y `defaultValue: "estudiante"`. El registro público solo crea `estudiante`; `profesor`/`admin` los asigna exclusivamente el admin vía `PATCH /api/v1/admin/users/:id/role` (`implementation_base.md` §Vista de Admin, `auth.md` §10.2).
- Datos adicionales del usuario como `additionalFields`: `username`, `givenName`, `familyName`, `role`. Better Auth gestiona `email`, `emailVerified`, `name` (se fija `name = givenName + " " + familyName`), `image`, `createdAt`, `updatedAt`.

### 8.2 Configuración (`infrastructure/auth/auth.config.ts`)

```ts
// apps/api/src/infrastructure/auth/auth.config.ts
import { betterAuth } from "better-auth";
import type { Env } from "../../config/env";
import { memoryAdapter } from "./memory-auth-adapter";

/** Factoría de Better Auth. El adapter en memoria comparte MemoryUserStore con InMemoryUserRepository (una sola fuente de verdad). */
export function createAuth(env: Env, store: MemoryUserStore) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,          // requerido; ≥ 32 bytes aleatorios
    baseURL: env.BETTER_AUTH_URL,            // p. ej. http://localhost:3001
    trustedOrigins: env.CORS_ORIGINS.split(",").map((s) => s.trim()), // web en localhost:3000
    database: { adapter: memoryAdapter(store) },
    session: {
      expiresIn: 60 * 60 * 24,               // 24 h
      updateAge: 60 * 60 * 8,                // renovación deslizante (sliding) cada 8 h
    },
    emailAndPassword: {
      enabled: true,
      password: {
        // auth.md §11.2: argon2id (o bcrypt con coste ≥ 12). Confirmar la ruta exacta de la opción contra la versión fijada.
        hash: async (password: string) => hashArgon2id(password),
        verify: async ({ hash, password }: { hash: string; password: string }) => verifyArgon2id(hash, password),
      },
    },
    user: {
      additionalFields: {
        username:   { type: "string", input: true, required: true },
        givenName:  { type: "string", input: true, required: true },
        familyName: { type: "string", input: true, required: true },
        role:       { type: "string", input: false, required: true, defaultValue: "estudiante" },
      },
    },
    advanced: {
      useSecureCookies: env.NODE_ENV === "production",
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        path: "/",
      },
      // cookiePrefix: "facy"  // opcional; si se usa, fijarlo y documentarlo (afecta los nombres de cookie)
    },
  });
}
```

> Notas de versión: la ruta exacta de las opciones (`emailAndPassword.password`, `advanced.defaultCookieAttributes`, `session.updateAge`) depende de la versión fijada de Better Auth; el `developer` la confirma en TDD y registra el desvío en `progress.md`. Los valores de contrato (24 h / sliding 8 h / argon2id) no cambian.

### 8.3 Cookies y orígenes de confianza

- Cookie de sesión con `httpOnly` + `SameSite=Lax` + `Secure` (producción) + `Path=/`: cumple `auth.md` §11.2 y R10 de `threat-model-api.md`.
- `SameSite=Lax` + **doble envío CSRF** (header `x-csrf-token` = valor de la cookie `better-auth.csrf_token`). Motivo: el web (`localhost:3000`) y la API (`localhost:3001`) son **same-site pero cross-origin**; la cookie Lax sí viaja entre ambos puertos, así que el CSRF es un riesgo real. Todas las mutaciones (`POST`/`PATCH`/`DELETE`) exigen el token (`middleware/csrf.ts`, §11.4).
- `trustedOrigins` = whitelist del web (`CORS_ORIGINS`). El navegador es el único cliente de origen cruzado confiable (`threat-model-api.md` §1).

### 8.4 Montaje del handler en Hono

Se monta el handler nativo de Better Auth para sus rutas y se implementan las **rutas wrapper del contrato** (`/register`, `/login`, `/session`, `/logout`) que llaman a `auth.api.*`, aplican las cookies de la respuesta y mapean a la forma wire `Session`.

```ts
// apps/api/src/infrastructure/auth/auth.hono.ts
import { Hono } from "hono";

/** Monta el handler nativo de Better Auth y las rutas del contrato wire de auth. */
export function mountAuth(app: Hono, auth: Auth, deps: AuthDeps): void {
  // 1) Handler nativo de Better Auth (cookies/CSRF gestionados por el proveedor en sus rutas).
  app.on(["POST", "GET"], "/api/v1/auth/*", (c) => auth.handler(c.req.raw));

  // 2) Rutas del contrato wire (ver §9.2): register, login, session, logout.
  app.post("/api/v1/auth/register", registerRoute(auth, deps));
  app.post("/api/v1/auth/login", loginRoute(auth, deps));
  app.get("/api/v1/auth/session", sessionRoute(auth));
  app.post("/api/v1/auth/logout", logoutRoute(auth));
}
```

> **Importante**: las rutas wrapper llaman a `auth.api.signUpEmail` / `auth.api.signInEmail` / `auth.api.getSession` / `auth.api.signOut` y **aplican los `set-cookie` devueltos** (cookie de sesión y cookie de CSRF `better-auth.csrf_token`). El `developer` confirma el mecanismo de devolución de cookies de la versión fijada (objeto `response.setCookie` de `auth.api.*`).

### 8.5 Adaptador en memoria (interfaz)

El adaptador traduce las operaciones de Better Auth a mapas en memoria. Interfaz objetivo (compatible con `DatabaseAdapter` de Better Auth; el `developer` ajusta los operadores a la versión fijada):

```ts
// apps/api/src/infrastructure/auth/memory-auth-adapter.ts
export type AuthModel = "user" | "session" | "account" | "verification";
export type WhereOp = "eq" | "ne" | "in" | "contains" | "startsWith" | "endsWith";
export type Where = { field: string; op: WhereOp; value: unknown };

/** Interfaz de adaptador de datos que exige Better Auth (patrón create/find/update/delete). */
export interface DatabaseAdapter {
  create(model: AuthModel, data: Record<string, unknown>): Promise<unknown>;
  findOne<T>(model: AuthModel, where: Where[]): Promise<T | null>;
  findMany<T>(model: AuthModel, where?: Where[], sortBy?: { field: string; direction: "asc" | "desc" }, limit?: number, offset?: number): Promise<T[]>;
  update<T>(model: AuthModel, where: Where[], data: Partial<Record<string, unknown>>): Promise<T | null>;
  updateMany<T>(model: AuthModel, where: Where[], data: Partial<Record<string, unknown>>): Promise<T[]>;
  delete(model: AuthModel, where: Where[]): Promise<unknown>;
  deleteMany(model: AuthModel, where: Where[]): Promise<unknown[]>;
  count(model: AuthModel, where?: Where[]): Promise<number>;
}

/** Implementación en memoria sobre MemoryUserStore (compartida con InMemoryUserRepository). */
export function memoryAdapter(store: MemoryUserStore): DatabaseAdapter;
```

### 8.6 Env añadido (pasa a requerido)

Las claves reservadas en `§5` pasan de `optional` a **requeridas en producción** cuando exista este módulo: `BETTER_AUTH_SECRET` (≥ 32 bytes), `BETTER_AUTH_URL`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`. Se añade `OPENAPI_ENABLED` para §10. `.env.example` documenta formatos **sin valores reales** (R5).

---

## 9. Endpoints `/api/v1/*` — especificación detallada

> Cada ruta detalla: método, ruta, acceso, esquema zod, respuesta (código + forma wire 1:1 con `src/lib/types.ts`) y enforcement por rol/propietario. Errores JSON sin fuga: `400` = validación (`{ "error": "validation_error", "message": ..., "details": [{ field, message }] }`), `401` = sin sesión, `403` = prohibido, `404` = no existe/no visible, `409` = conflicto, `429` = rate limit, `413` = cuerpo excesivo.

### 9.1 Esquemas compartidos (`src/domain/validation.ts`)

```ts
// Reglas de auth.md §4 revalidadas EN EL SERVIDOR (R8): la validación del cliente no es control de acceso.
const NAME_RE = /^[\p{L}' -]+$/u;                       // letras con acentos, espacio, "-", "'"
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordRegisterSchema = z.string().min(8).max(128); // sin trim: los espacios son válidos
export const passwordLoginSchema  = z.string().min(1).max(128);   // sin min 8 en login (no revelar política)
export const nameSchema = z.string().trim().min(2).max(60).regex(NAME_RE, "invalid_name");
export const usernameSchema = z.string().trim().min(1).max(50).regex(/^[a-z0-9._-]+$/, "invalid_username");
export const idSchema = z.string().min(1).max(64);
export const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD
```

Esquemas por dominio:

```ts
export const postCategorySchema = z.enum(["noticias", "eventos", "defensas", "investigacion", "convocatorias"]);
export const postTypeSchema     = z.enum(["post", "articulo", "ensenanza"]);
export const postVisibilitySchema = z.enum(["publicado", "borrador", "oculto"]);
export const authorVisibilitySchema = z.enum(["publicado", "borrador"]); // "oculto" solo vía admin (§9.6)

export const PostDraftSchema = z.object({
  title:      z.string().trim().min(1).max(200),
  content:    z.string().min(1).max(10000),      // cuerpo Markdown; límite anti-DoS
  category:   postCategorySchema,
  type:       postTypeSchema,
  visibility: authorVisibilitySchema,            // el autor crea publicado o borrador
  imageUrl:   z.string().url().max(2048).nullable().optional().default(null),
});
export const UpdatePostSchema = PostDraftSchema.partial()
  .refine((v) => Object.keys(v).length > 0, { message: "empty_patch" });
export const AdminUpdatePostSchema = UpdatePostSchema.extend({
  // Variante del PATCH /posts/:id para admin: puede fijar además "oculto" (moderación) sin pasar por /admin/posts/:id/visibility.
  visibility: postVisibilitySchema.optional(),
});
export const AdminSetVisibilitySchema = z.object({
  visibility: z.enum(["publicado", "oculto"]),   // ocultar o restaurar
});
export const SetUserRoleSchema = z.object({
  role: z.enum(["estudiante", "profesor", "admin"]),
});

export const FeedQuerySchema = z.object({
  // Nombres wire en español = los que emite `toSearchParams` (src/lib/filters.ts): §6 y §9.3.
  q:          z.string().trim().max(80).optional().default(""),
  categoria:  z.enum(["noticias", "eventos", "defensas", "investigacion", "convocatorias", "todas"]).optional().default("todas"),
  tipo:       z.enum(["post", "articulo", "ensenanza", "todos"]).optional().default("todos"),
  autor:      z.string().max(64).optional().default("todos"),
  estado:     z.enum(["publicado", "borrador", "oculto", "todos"]).optional().default("todos"),
  desde:      dateParamSchema.nullable().optional().default(null),
  hasta:      dateParamSchema.nullable().optional().default(null),
  limit:      z.coerce.number().int().min(1).max(100).optional().default(6), // el web usa múltiplos de 6 ("Cargar más")
  offset:     z.coerce.number().int().min(0).optional().default(0),
});
```

### 9.2 Auth

| Ruta | Método | Acceso | Body | Respuesta | Enforcement |
| --- | --- | --- | --- | --- | --- |
| `/auth/register` | POST | público | `{ givenName, familyName, email, password }` | `201` `Session` + cookie | rate limit por IP (R7/R12); anti-enumeración |
| `/auth/login` | POST | público | `{ username, password }` | `200` `Session` + cookie (JWT nuevo) | rate limit por IP + username (R7/R13) |
| `/auth/session` | GET | cookie | — | `200` `Session` \| `401` | sesión válida y no expirada |
| `/auth/logout` | POST | cookie | — | `204` | sesión; CSRF |

- **register** → `201` con `Session` (forma wire) y `Set-Cookie`. Conflicto de `email` o de `username` derivado → `409` **genérico idéntico** `{ "error": "account_conflict", "message": "No pudimos crear la cuenta. Intenta de nuevo." }` (nunca diferenciar email vs. username; joya P0 anti-enumeración, R12). El `role` que llegara en el body se **ignora** (el registro solo crea `estudiante`).
- **login** → fallo (usuario inexistente o contraseña incorrecta) → `401` idéntico `{ "error": "invalid_credentials", "message": "El usuario o la contraseña no coinciden." }`. Flujo: resuelve `username → email` (repo), delega en `auth.api.signInEmail`; si el username no existe devuelve el **mismo** `401` (hash señuelo para tiempo constante, R13).
- **session** → devuelve `{ user: { id, username, role }, expiresAt }` (1:1 `Session`). El `role` se **re-lee del store por petición** (rol fresco, R14), no del claim del JWT.
- **logout** → `204`; se descarta/expira la sesión (en stateless: se borra la cookie; opcional lista negra en memoria de tokens revocados, §11.3).

### 9.3 Posts y feed

| Ruta | Método | Acceso | Request | Respuesta | Enforcement |
| --- | --- | --- | --- | --- | --- |
| `/posts` | GET | autenticado | query `FeedQuerySchema` | `200` `PostPage` | sesión; visibilidad session-aware (R11/R15) |
| `/posts/:id` | GET | autenticado | path `idSchema` | `200` `Post` \| `404` | sesión + `canViewPost`; no visible → `404` |
| `/posts` | POST | autenticado | `PostDraftSchema` | `201` `Post` | sesión; `authorId` desde sesión (nunca del body) |
| `/posts/:id` | PATCH | autor o admin | `UpdatePostSchema` | `200` `Post` \| `403` \| `404` | propietario/admin (IDOR, R15) |
| `/posts/:id` | DELETE | autor o admin | — | `204` \| `403` \| `404` | propietario/admin (IDOR, R15) |

**Feed (`GET /posts`)** — réplica de `src/lib/visibility.ts` + `applyFilters` de `src/lib/filters.ts`:
1. Visibilidad: `canViewPost` (publicado → todos; borrador → autor; oculto → autor y admin).
2. Filtros (sobre lo visible): `q` en título y cuerpo (normalización sin diacríticos), `categoria`, `tipo`, `autor`, `estado`, `desde`, `hasta`.
3. Orden `publishedAt` DESC; paginación `limit`/`offset`.
4. Mapa de query a `PostFilters`: `q→keyword`, `categoria→category`, `tipo→type`, `autor→authorId`, `estado→status`, `desde→dateFrom`, `hasta→dateTo`.

**Crear (`POST /posts`)**: `authorId` = `session.user.id` (inmutable en el body). `createdAt = updatedAt = publishedAt = now` (ISO). Respuesta `201` `Post` completo.

**Editar (`PATCH /posts/:id`)**: campos editables: `title`, `content`, `category`, `type`, `visibility` (autor: solo `publicado`/`borrador`; admin: además `oculto`), `imageUrl`. **No editables**: `id`, `authorId`, `createdAt`, `publishedAt`. `publishedAt` se fija a `now` solo en la transición `borrador → publicado`; el resto de transiciones lo conservan (`updatedAt = now` siempre). No-propietario y no-admin → `403`; id inexistente → `404`.

**Eliminar (`DELETE /posts/:id`)**: `204` sin cuerpo. No-propietario y no-admin → `403`.

### 9.4 Usuarios

| Ruta | Método | Acceso | Request | Respuesta | Enforcement |
| --- | --- | --- | --- | --- | --- |
| `/users/authors` | GET | autenticado | — | `200` `AuthorOption[]` | sesión |
| `/users/:username` | GET | autenticado | path `usernameSchema` | `200` `{ user: User, posts: Post[] }` \| `404` | sesión; email redactado salvo propio/admin |

- **`/users/authors`**: `listAuthors()` → `AuthorOption[]` (`{ id, username, fullName }`), orden `fullName` locale `"es"`, solo usuarios con al menos una publicación. **Nunca** incluye `email` ni `role`.
- **`/users/:username`**: devuelve `User` (forma wire) + `posts` = `findVisible({ ...DEFAULT, authorId: user.id }, { limit: 100, offset: 0 }, session)`. **Email redactado**: si el perfil es de otro usuario y el llamante no es admin, `user.email = ""` (mantiene la forma 1:1 de `User` sin filtrar PII). `username` inexistente → `404` genérico (anti-enumeración, R18).

### 9.5 Admin (asignación de rol)

| Ruta | Método | Acceso | Request | Respuesta | Enforcement |
| --- | --- | --- | --- | --- | --- |
| `/admin/users/:id/role` | PATCH | solo `admin` | `SetUserRoleSchema` | `204` \| `404` \| `409`/`422` | rol admin verificado en servidor por petición (R16) |

Cambia `role` en el store; el efecto es inmediato para la siguiente petición (rol fresco, R14). `id` inexistente → `404`. **El rol `admin` es inmutable** (decisión de producto 2026-10-09, `wireframes_admin.md` §1.4 D2): el endpoint rechaza (`409`/`422`) toda transición que salga de `admin`, tanto propia como de otro admin. Ya **no** es un riesgo asumido: convierte el lock-out en control (R16 de `threat-model-api.md`). El alta/baja de administradores es operativa (seed/ambiente), no por API.

### 9.6 Admin (moderación de publicaciones)

| Ruta | Método | Acceso | Request | Respuesta | Enforcement |
| --- | --- | --- | --- | --- | --- |
| `/admin/posts/:id/visibility` | PATCH | solo `admin` | `AdminSetVisibilitySchema` | `200` `Post` \| `404` \| `409`/`422` | rol admin (R16) |

Oculta (`visibility: "oculto"`) o restaura (`"publicado"`) una publicación **ya publicada** (nunca un `borrador` ajeno: el endpoint rechaza (`409`/`422`) moderar un post en `borrador`, F-03). Es el **único** camino para fijar `oculto` (el autor no puede). `404` si el id no existe. La visibilidad resultante se refleja de inmediato en el feed (R15).

---

## 10. Documentación OpenAPI

### 10.1 Generación

Stack: **`@hono/zod-openapi`** (definir rutas con esquemas zod → genera OpenAPI 3.1) y, opcionalmente, **`@hono/swagger-ui`** para la UI. Alternativa aceptada: documento manual con `Hono.openapi()` solo si se mantiene al día; el `developer` elige **una** vía y la registra en `progress.md`.

```ts
// apps/api/src/routes/openapi.ts
import { OpenAPIHono } from "@hono/zod-openapi";

/** Documento raíz: metadatos y schemes de seguridad. Sin secretos ni datos internos (R17). */
export const openApiDoc = {
  openapi: "3.1.0",
  info: {
    title: "Red FaCyT API",
    version: "v1",
    description: "API institucional de la Facultad Experimental de Ciencias y Tecnología. Contrato wire 1:1 con src/lib/types.ts.",
  },
  securitySchemes: {
    sessionCookie: { type: "apiKey", in: "cookie", name: "better-auth.session_token" },
    csrfHeader:    { type: "apiKey", in: "header", name: "x-csrf-token" },
  },
};
```

### 10.2 Exposición y seguridad

- `GET /api/v1/openapi.json` → documento JSON generado.
- `GET /api/v1/docs` → UI Swagger (solo si se decide incluirla).
- **Bloqueo en producción** (joya P1 secretos, `crown-jewels.md`): con `NODE_ENV=production` o `OPENAPI_ENABLED=false`, ambas rutas responden `404` y no se montan. Nunca documentar rutas internas, valores de env, secretos ni esquemas de BD.
- **Schemes por ruta**: las rutas autenticadas declaran `security: [{ sessionCookie: [] }]`; las mutaciones declaran además `csrfHeader`. `health` queda pública sin scheme.

### 10.3 Contenido

Solo formas wire (`Post`, `PostPage`, `AuthorOption`, `Session`, `User`, `UserRole`) y cuerpos de petición (`PostDraft`, `Login`, `Register`, `SetUserRole`, `SetPostVisibility`, `FeedQuery`). Errores documentados como respuestas genéricas (`400/401/403/404/409/429/413`).

---

## 11. Implementación en memoria (estructura)

### 11.1 `infrastructure/repositories/in-memory/`

```
apps/api/src/infrastructure/repositories/in-memory/
├── user-store.ts                       → MemoryUserStore (mapas user/session/account/verification + índices byUsername/byEmail)
├── in-memory-post-repository.ts        → InMemoryPostRepository (findVisible/findById/create/update/delete)
├── in-memory-post-repository.test.ts   → contract tests (espejo de post-repository.contract.test.ts + escritura)
├── in-memory-user-repository.ts        → InMemoryUserRepository (listAuthors/findById/findByUsername/updateRole)
└── in-memory-user-repository.test.ts   → contract tests
```

- **`MemoryUserStore`**: única fuente de verdad de usuarios del MVP. `InMemoryUserRepository` **y** `MemoryAuthAdapter` leen/escriben el mismo store → el cambio de rol por admin es visible para la autorización de inmediato (R14) y los usuarios creados por Better Auth quedan visibles para los casos de uso.
- **`InMemoryPostRepository`**: implementa la parte de lectura espejo (`findVisible`, `findById`) **y** las extensiones de escritura de la API (§11.3). `findVisible` replica `canViewPost` → `applyFilters` → orden `publishedAt` DESC → paginación.

### 11.2 `application/` (casos de uso que inyectan puertos)

```ts
// application/auth/register-user.ts
export type RegisterUserCommand = { givenName: string; familyName: string; email: string; password: string };
export type UsernameGenerator = (givenName: string, familyName: string) => string; // determinista + sufijo numérico si colisiona
export async function registerUser(auth: Auth, users: UserRepository, cmd: RegisterUserCommand): Promise<{ session: Session }>;

// application/auth/sign-in.ts
export async function signInUser(auth: Auth, users: UserRepository, cmd: { username: string; password: string }): Promise<{ session: Session }>;

// application/auth/session.ts
export async function getCurrentSession(auth: Auth, req: HonoRequest): Promise<Session | null>; // rol fresco (R14)
export async function signOutUser(auth: Auth, req: HonoRequest): Promise<void>;

// application/posts/*
export function createPost(deps: { posts: PostRepository; now?: () => Date }): (draft: PostDraft, session: Session) => Promise<Post>;
export function updatePost(deps: { posts: PostRepository; now?: () => Date }): (id: string, patch: UpdatePost, session: Session) => Promise<Post>;
export function deletePost(deps: { posts: PostRepository }): (id: string, session: Session) => Promise<void>;
export function getPost(deps: { posts: PostRepository }): (id: string, session: Session) => Promise<Post>;
export function getFeed(deps: { posts: PostRepository }): (filters: PostFilters, page: PageOptions, session: Session) => Promise<PostPage>;

// application/users/*
export function listAuthors(deps: { users: UserRepository; posts: PostRepository }): () => Promise<AuthorOption[]>;
export function getProfile(deps: { users: UserRepository; posts: PostRepository }): (username: string, session: Session) => Promise<{ user: User; posts: Post[] }>;

// application/admin/*
export function setUserRole(deps: { users: UserRepository }): (id: string, role: UserRole) => Promise<void>;
export function setPostVisibility(deps: { posts: PostRepository }): (id: string, visibility: "publicado" | "oculto") => Promise<Post>;
```

### 11.3 Extensiones de puertos (solo API; no rompen el espejo frontend)

```ts
// domain/post.ts — extensión de PostRepository (el frontend solo usa la parte de lectura)
export type PostDraft = { title: string; content: string; category: PostCategory; type: PostType; visibility: "publicado" | "borrador"; imageUrl: string | null };
export interface PostRepository {
  findVisible(filters: PostFilters, page: PageOptions, session: Session): Promise<PostPage>;   // espejo frontend
  findById(id: string): Promise<Post | null>;                                                  // espejo frontend
  create(draft: PostDraft & { authorId: string; publishedAt: string; createdAt: string; updatedAt: string }): Promise<Post>;
  update(id: string, patch: UpdatePost): Promise<Post | null>;
  delete(id: string): Promise<boolean>;
}

// domain/user.ts — extensión de UserRepository
export interface UserRepository {
  listAuthors(): Promise<AuthorOption[]>;                    // espejo frontend
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  updateRole(id: string, role: UserRole): Promise<User | null>;
}
```

> La extensión no rompe el contrato del frontend: el web nunca implementó puertos de escritura; los writes llegan vía API. El espejo de lectura queda intacto (`findVisible`, `findById`, `listAuthors`).

### 11.4 `routes/` y middleware

```
apps/api/src/routes/
├── auth.routes.ts      → register/login/session/logout (wrapper de auth.api.*)
├── posts.routes.ts     → feed + CRUD
├── users.routes.ts     → /users/authors, /users/:username
├── admin.routes.ts     → /admin/users/:id/role, /admin/posts/:id/visibility
└── openapi.ts          → documento OpenAPI + /openapi.json, /docs
```

Los handlers montan `requireSession`/`requireRole`/`csrf` y los casos de uso:

```ts
// middleware/require-session.ts — identidad por cookie + rol FRESCO del store (R14)
export function requireSession(auth: Auth, users: UserRepository): MiddlewareHandler;
//   401 si no hay sesión válida; fija c.var.session = { user: { id, username, roleFresco }, expiresAt }

// middleware/require-role.ts
export function requireRole(...roles: UserRole[]): MiddlewareHandler;
//   403 si c.var.session.user.role no está en roles

// middleware/csrf.ts — doble envío: header x-csrf-token == cookie better-auth.csrf_token (mutaciones)
export function csrf(trustedOrigins: string[]): MiddlewareHandler;
//   Origin (si presente) fuera de whitelist → 403; token ausente/incorrecto → 403
```

---

## 12. Verificación y Definition of Done (entrega auth + endpoints)

### 12.1 Contract tests de formas wire

- Fixtures con las formas exactas de `src/data/*` y asserts del JSON devuelto **1:1** con `Post`, `PostPage`, `AuthorOption`, `Session`, `User` (sin campos extra ni ausentes).
- Replicar el contrato de visibilidad del feed: portar las **9 combinaciones** de `src/lib/visibility.test.ts` al `in-memory-post-repository.test.ts` (publicado/borrador/oculto × autor/otro/admin).

### 12.2 Tests de ruta (por endpoint y por regla de enforcement)

| Regla | Test mínimo |
| --- | --- |
| Auth register `201/400/409/429` | payload válido → 201 + cookie; cada regla de `auth.md` §4 inválida → 400 con detalle de campo; email duplicado → 409 genérico **idéntico** a username duplicado; body con `role` → ignorado (usuario creado `estudiante`); N+1 registros/IP → 429 |
| Auth login `200/401/429` | login OK → 200 `Session` + cookie nueva; usuario inexistente y contraseña incorrecta → **exactamente el mismo** 401; N+1 fallos → 429 |
| Auth session/logout | cookie válida → 200; sin cookie → 401; cookie firmada con otro secreto → 401; expirada → 401; logout → 204 y session posterior → 401 |
| CSRF | mutación sin `x-csrf-token` (con `Origin` presente) → 403 |
| Feed `GET /posts` | `publicado` visible a todos; `borrador`/`oculto` ajenos fuera de resultados; admin ve `oculto` pero **no** `borrador` ajeno; filtros y paginación por contrato; query inválida → 400 |
| `GET /posts/:id` | borrador propio → 200; borrador/oculto ajeno → 404 |
| `POST /posts` | 201 con `authorId` de la sesión; body con `authorId`/`role` inyectado → ignorado; payload inválido → 400 |
| `PATCH`/`DELETE /posts/:id` | post ajeno → 403; propio → 200/204; admin sobre cualquiera → 200/204; `publishedAt` inmutable (PATCH que lo envía → ignorado) |
| `GET /users/authors` | solo autores con publicaciones; sin `email`/`role` |
| `GET /users/:username` | propio/admin → email completo; ajeno → email `""`; inexistente → 404 |
| `PATCH /admin/users/:id/role` | estudiante/profesor → 403; admin → 204 y el rol cambia en el store; id inexistente → 404 |
| `PATCH /admin/posts/:id/visibility` | no-admin → 403; admin `oculto`/`publicado` → 200 y el feed lo refleja |
| OpenAPI | `NODE_ENV=production` → `/api/v1/openapi.json` y `/docs` → 404; dev → 200 sin secretos ni valores internos |

### 12.3 Definition of Done de esta entrega

1. `pnpm --filter @red-facyt/api test:coverage` ≥ 80% (nuevos módulos incluidos); `typecheck` y `lint` limpios.
2. Todas las rutas de §9 responden según el código y la forma wire especificados, con la matriz de enforcement de §12.2 probada.
3. El feed replica las 9 combinaciones de `visibility.ts` (contract test).
4. OpenAPI visible en dev, bloqueado en producción; sin secretos (test de grep).
5. Cookies `httpOnly`/`SameSite=Lax`/`Secure`(prod) verificadas por test de headers; CSRF en mutaciones.
6. El `developer` registra en `progress.md`: rutas implementadas, desvíos (nombres wire de query, rutas de opciones de Better Auth confirmadas contra la versión fijada) y estado del Kanban.

---

## 13. Configuración Vitest / tsconfig (bloques de referencia)

### 13.1 `apps/api/tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "vitest.config.mts", "eslint.config.mjs"]
}
```

> `noEmit: true`: el typecheck lo hace `tsc --noEmit`; el build lo hace `tsup` (ESM). Se evita el problema de extensiones de `NodeNext` en imports.

### 13.2 `apps/api/vitest.config.mts`

```ts
import { defineConfig } from "vitest/config";

/** Config de Vitest de la API: entorno node, cobertura >= 80% (gate Husky). */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.d.ts"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      reporter: ["text", "html", "lcov"],
    },
  },
});
```

### 13.3 `apps/api/package.json` (scripts)

```jsonc
{
  "name": "@red-facyt/api",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm --dts --clean",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint --max-warnings 0 .",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

> **Dependencia/bloqueo para el `developer`**: el web en la raíz usa `pnpm lint` / `pnpm test:coverage` en el hook Husky (`docs/husky.md`). Con la API como segundo workspace hay que decidir si el gate de Husky pasa a cubrir ambos (p. ej. `pnpm -r lint` + `pnpm -r test:coverage`, o scripts raíz `lint:all`/`test:all`). Esta es una coordinación con `devops`/`product-manager`, no una decisión de este documento; el scaffold de la API debe exponer `lint`/`test`/`test:coverage` como contrato para que el hook se pueda ampliar sin tocar la API.

---

## 14. Definición de hecho (Definition of Done) del scaffold

El `developer` marca el scaffold como terminado cuando, verificablemente:

1. `pnpm --filter @red-facyt/api test:coverage` pasa con **≥ 80%** en líneas, funciones, ramas y sentencias.
2. `pnpm --filter @red-facyt/api typecheck` y `lint` pasan sin errores ni warnings.
3. `GET /api/v1/health` responde `{ status: "ok", ... }` con la API arrancada (`pnpm --filter @red-facyt/api dev`).
4. `app.test.ts` verifica: 404 JSON, cabeceras de seguridad, CORS whitelist (permitido/denegado), `413` en cuerpo excesivo y ausencia de stack en errores.
5. `.env.example` existe sin secretos reales; `parseEnv` falla rápido con env inválido (test de `env.test.ts`).
6. Los puertos de `src/domain/*` existen con las firmas de `src/lib/repositories/post-repository.ts` y `src/lib/types.ts` (JSDoc incluido).
7. `docs/architecture/progress.md` y el Kanban reflejan el estado (lo actualiza el `developer`/documentación, no este agente).

---

## 15. Referencias cruzadas

- Modelo de amenaza y requisitos P0/P1 del scaffold y de la entrega auth+endpoints: `docs/security/threat-model-api.md` (R1–R18).
- Contrato de transición de auth al backend: `docs/design/auth.md` §11.2.
- Puertos hexagonales a cumplir: `src/lib/repositories/post-repository.ts`.
- Regla de visibilidad del feed a replicar en servidor: `src/lib/visibility.ts`.
- Nombres wire de query del feed: `src/lib/filters.ts`.
- Joyas de la corona: `docs/security/crown-jewels.md`.