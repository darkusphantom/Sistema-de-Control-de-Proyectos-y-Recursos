# Modelo de Amenaza — API Red FaCyT

Documento de seguridad (agente `security-architect`) sobre la **superficie de la API inicial** (`apps/api`, Hono 4). Cubre el scaffold (endpoint de salud + middleware) y las superficies que llegarán con auth, base de datos y endpoints de negocio. Define requisitos de seguridad **P0/P1** concretos y **cómo se comprobará cada uno**.

> Este documento es la contrapartida de `docs/architecture/api-structure.md`. La prioridad de todo requisito sigue a `docs/security/crown-jewels.md`.

---

## 1. Alcance y supuestos

- **En alcance**: la superficie HTTP expuesta por `apps/api` (entry point `@hono/node-server`, pipeline de middleware, config/env, endpoint `GET /api/v1/health`), las superficies del scaffold y la **entrega de auth + endpoints `/api/v1/*`** (Better Auth en memoria con sesiones stateless JWT, posts/feed, usuarios, admin, OpenAPI). Requisitos R1–R11 (scaffold) + R12–R18 (esta entrega).
- **Fuera de alcance de este documento**: la superficie del frontend Next.js (protegida en su propia fase) y el modelo de datos PostgreSQL en sí (lo tratará `security-reviewer` con RLS/policies cuando exista, `crown-jewels.md` §P0-BD).
- **Supuesto**: la API se despliega detrás de un reverse proxy (Caddy/Nginx) que termina TLS; HSTS se emite por la API, la terminación TLS es del proxy. El CORS whitelist es estricto porque el navegador es el único cliente confiable de origen cruzado.
- **Supuesto de la entrega**: sesiones **stateless (JWT firmado con `BETTER_AUTH_SECRET`)** y almacenamiento **en memoria** (adapter de Better Auth + repositorios in-memory), migrables a PostgreSQL sin rework. La terminación TLS es del proxy: los flags `Secure` de las cookies dependen de que la API reciba HTTPS en producción.

---

## 2. Actores

| Actor | Motivación | Superficie API principal |
| --- | --- | --- |
| Atacante externo (Internet) | Escaneo, DoS, fuga de datos, abuso de endpoints | `/health`, cualquier ruta no autenticada, abuso de cuerpo/headers |
| Usuario autenticado malicioso | IDOR, escalada de rol, manipulación de publicaciones ajenas | CRUD de posts, `/users/:username`, `/admin/*` |
| Bots / scripts | Fuerza bruta en login, spam de registro, scraping del feed | `/auth/*`, `/posts` |
| Insider (admin comprometido) | Exfiltración, manipulación de contenidos, escalada a otros admins | `/admin/*`, `/users/*` |
| Proveedor de dependencias | Supply chain (dependencia maliciosa) | `package.json`/lockfile de `apps/api` |

---

## 3. Superficies de ataque

| # | Superficie | Estado | Descripción |
| --- | --- | --- | --- |
| S1 | Entry point HTTP (`@hono/node-server`) | scaffold | Acepta cualquier request TCP/HTTP; primer punto de control de headers, cuerpo y método. |
| S2 | Pipeline de middleware | scaffold | Orden y correctitud de: request-id, security headers, CORS whitelist, body limit, rate limit, error handler, 404. |
| S3 | `GET /api/v1/health` | scaffold | Único endpoint. No debe filtrar env, stack ni datos. |
| S4 | Config/env (`parseEnv`) | scaffold | Manipulación del entorno (variables ausentes/maliciosas) y fuga de secretos en logs. |
| S5 | Auth (`/auth/*`) | esta entrega (Better Auth, en memoria) | Login, registro, sesión, logout. Joya P0 credenciales/sesiones. |
| S6 | Posts (`/posts*`) | esta entrega | CRUD con visibilidad (publicado/borrador/oculto) y propiedad. Joya P0 publicaciones. |
| S7 | Usuarios (`/users/:username`, `/users/authors`) | esta entrega | Exposición de datos de perfil; enumeración. |
| S8 | Admin (`/admin/*`) | esta entrega | Asignación de roles y moderación; joya P0 acceso. |
| S9 | Uploads (`/uploads`) | futuro | Multipart; DoS por tamaño y fuga de archivos. |
| S10 | Dependencias | scaffold+futuro | Supply chain (Hono, node-server, secure-headers, pino, zod, better-auth, etc.). |
| S11 | OpenAPI (`/openapi.json`, `/docs`) | esta entrega | Fuga de esquemas internos/secretos; abuso de la UI de docs. |

---

## 4. Impacto sobre las joyas de la corona (`crown-jewels.md`)

Tabla que traza cada superficie API a las joyas P0/P1/P2 que comprometería un ataque exitoso.

| Superficie | Joya afectada | Escenario de ataque | Severidad si se concreta |
| --- | --- | --- | --- |
| S2 (CORS) | P1 API | Origin reflejado → script externo lee respuestas autenticadas (robo de sesión/datos) | 🔴 Crítico (toca P0 sesión) |
| S2 (error handler) | P1 API / P2 hardening | Stack trace o detalle interno en respuesta → fuga de rutas, libs, DB | 🟡 Advertencia |
| S2 (body limit) | P1 API | Cuerpo gigante en `/health` u otro endpoint → DoS / saturación de memoria | 🟡 Advertencia |
| S3 (health) | P1 secretos | Health que refleje env/versiones → ayuda a fingerprinting | 🔵 Sugerencia (P2) |
| S4 (env) | P1 secretos | Variable requerida con default silencioso o secreto en log → credenciales filtradas | 🔴 Crítico |
| S5 (auth) | P0 credenciales/sesiones | Fuerza bruta, enumeración de usuarios, session fixation, cookies inseguras | 🔴 Crítico |
| S6 (posts) | P0 publicaciones + P0 acceso | IDOR horizontal (editar post ajeno), ver `borrador`/`oculto` ajeno, falta de validación | 🔴 Crítico |
| S8 (admin) | P0 acceso | Usuario no-admin llama a `/admin/*`, escalada de rol | 🔴 Crítico |
| S9 (uploads) | P1 API | Multipart sin límite → DoS; path traversal en archivo | 🟡 Advertencia |
| S10 (deps) | P1 secretos (config) | Dependencia comprometida en runtime | 🟡 Advertencia |
| S5 (auth) / S6 (posts) | P2 disponibilidad | Sin rate limit → saturación de login o de creación | 🟡 Advertencia |
| S5 (auth — registro) | P0 credenciales | Enumeración de cuentas por mensajes/estado diferenciados; autoasignación de rol en el registro | 🔴 Crítico |
| S5 (auth — sesión stateless) | P0 sesiones | JWT firmado con secreto débil, sin expiración/rotación; rol `stale` tras cambio por admin | 🔴 Crítico |
| S6 (posts — feed) | P0 publicaciones | Fuga de `borrador`/`oculto` ajeno si la visibilidad no se replica en servidor | 🔴 Crítico |
| S7 (usuarios) | P0 acceso / P1 API | Enumeración de usernames; fuga de email de terceros en perfiles | 🟡 Advertencia |
| S8 (admin — rol fresco) | P0 acceso | Democión no efectiva (claim JWT stale) → escalada persistente de privilegios | 🔴 Crítico |
| S11 (OpenAPI) | P1 secretos | Esquemas internos, valores de env o secretos en el documento; docs abiertas en producción | 🟡 Advertencia |

---

## 5. Requisitos de seguridad mínimos

Cada requisito indica su prioridad (P0/P1/P2), cuándo aplica (**scaffold** ahora o **auth/DB/endpoints** después) y **cómo se comprobará**. Los requisitos P0/P1 son obligatorios; los P2 se implementan como hardening.

### R1 — CORS con whitelist estricta (P1 · scaffold · joya P1-API)

- Configurar `hono/cors` con lista de orígenes desde `CORS_ORIGINS` (env). **Sin reflejo del header `Origin`** y **sin** `Access-Control-Allow-Origin: *`. Rechazar `Origin: null`.
- **Cómo se comprobará** (test `cors.test.ts` en `app.test.ts`):
  - Request con `Origin: http://localhost:3000` (origen permitido) → respuesta con `Access-Control-Allow-Origin` = ese origen.
  - Request con `Origin: https://evil.example` (no permitido) → respuesta **sin** cabecera `Access-Control-Allow-Origin` (o 403 si se decide rechazo explícito).
  - Request con `Origin: null` → sin cabecera.
  - No existe `Access-Control-Allow-Origin: *` en ningún test ni en el código.

### R2 — Errores sin fuga de detalle interno (P1 · scaffold · joya P1-API + P2-hardening)

- `onError` central devuelve JSON genérico: `{ "error": "internal_error", "message": "Internal server error" }`.
- En `NODE_ENV=production` jamás se incluye `stack`, mensaje interno ni ruta del módulo. El detalle solo va al log del servidor (redactado, ver R9).
- **Cómo se comprobará**:
  - Test que fuerza un error 500 en un handler de prueba y assert de que el cuerpo NO contiene `at `, `Error:`, nombres de archivo (`src/`), ni `stack`.
  - Test que verifica que en `production` el cuerpo es exactamente el genérico y que en `development` puede incluir detalle (pero nunca credenciales).
  - Review estática: grep en `src/` de `c.json(` con valores internos y de `console.log` de requests.

### R3 — Límite de tamaño de cuerpo y profundidad (P1 · scaffold · joya P1-API)

- `hono/body-limit` global con `MAX_BODY_BYTES` (100 KB por defecto) devolviendo `413`.
- Profundidad JSON limitada (cuando llegue la validación de request): usar parser que rechace anidación excesiva (config de `zod`/`hono`); se documenta como requisito del paso auth/endpoints.
- **Cómo se comprobará**:
  - Test: `POST /api/v1/health` con cuerpo > `MAX_BODY_BYTES` → `413`.
  - Test de config: cambiar `MAX_BODY_BYTES` y verificar que el límite cambia.
  - (futuro) Test con JSON de profundidad > N → `400`/`413`.

### R4 — Cabeceras de seguridad (P2 · scaffold · joya P2-hardening)

- `@hono/secure-headers` con: `Content-Security-Policy` razonable para una API JSON (por defecto `default-src 'none'`, `frame-ancestors 'none'`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`. Sin `X-Powered-By` ni `Server` revelador.
- **Cómo se comprobará** (test `app.test.ts`): `GET /api/v1/health` debe incluir `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`; y NO debe incluir `X-Powered-By`.

### R5 — Secretos en env, nunca en repo ni logs (P1 · scaffold · joya P1-secretos)

- `parseEnv` con `zod`: fail-fast si falta variable **requerida** en `production`; sin defaults silenciosos para secretos.
- `.env.example` sin valores reales; `.gitignore` ya ignora `.env*` salvo `.env.example` (verificado).
- Cero secretos en código fuente, tests, ni `console.log`.
- **Cómo se comprobará**:
  - `env.test.ts`: env sin `CORS_ORIGINS` en `production` → `parseEnv` lanza; env válido → devuelve el objeto tipado.
  - Grep de `.env`/secretos: `rg -i "(password|secret|token|api[_-]?key)" apps/api/src apps/api/.env.example` no debe encontrar valores reales (solo nombres de claves).
  - Review: confirmar que `apps/api/.env` está en `.gitignore` (o se agrega) y que `apps/api/.env.example` está versionado.

### R6 — 404 y respuestas de error en JSON, sin leak (P1 · scaffold · joya P1-API)

- `notFound` devuelve `{ "error": "not_found", "message": "Not found" }` con `404`. Sin volcar la ruta solicitada ni el stack.
- **Cómo se comprobará** (test en `app.test.ts`): `GET /api/v1/nonexistent` → `404`, `Content-Type: application/json`, cuerpo sin datos de ruta interna.

### R7 — Rate limiting en auth (P0 · cuando llegue auth · joya P0-credenciales/sesiones)

- `hono-rate-limiter` (MemoryStore) sobre `/auth/login` y `/auth/register`: límite por **IP** y, cuando haya sesión, por **usuario**. Backoff exponencial y bloqueo tras N intentos fallidos (`auth.md` §11.2).
- En el scaffold se crea el **slot** (`middleware/rate-limit.ts` + claves de env `RATE_LIMIT_MAX`/`RATE_LIMIT_WINDOW_MS`) sin lógica de negocio.
- **Cómo se comprobará** (cuando exista auth):
  - Test: N+1 intentos fallidos consecutivos de login desde la misma IP → `429` y mensaje genérico (sin revelar si la cuenta existe).
  - Test: ventana expirada permite reintentar.
  - Test: `429` no distingue usuario existente/inexistente (anti-enumeración, joya P0).

### R8 — Validación estricta de entrada en servidor (P0 · cuando lleguen endpoints · joya P0-publicaciones + P1-API)

- Toda ruta valida con `zod`: tipos, longitudes, formatos (email/UUID), revalidando **en servidor** las reglas de `auth.md` §4 (username ≤ 50; contraseña 8–128 sin `trim`; email ≤ 254 normalizado a minúsculas; nombre/apellido 2–60). La validación del cliente es UX, nunca control de acceso (`auth.md` §11.2).
- `PostDraft` valida `title`, `content` (longitud máxima), `category`, `type`, `visibility`.
- **Cómo se comprobará**:
  - Test por cada regla: payload inválido → `400` con `{ "error": "validation_error", "message": ... }` y detalle de campo.
  - Test: payload válido límite (longitud máx.) → aceptado; payload sobre límite → `400`.
  - Review: `security-reviewer` comprueba que los validadores del servidor existen y no confían en el cliente.

### R9 — Logging seguro (P2 · scaffold y futuro · joya P2-hardening)

- `pino` con redacción de campos sensibles: nunca loguear contraseñas, tokens, cookies ni cuerpos de `/auth/*`. `request-id` (`x-request-id`) para correlacionar sin loguear datos.
- **Cómo se comprobará**:
  - Test del middleware de logging: body de login (con password) no aparece en la salida del logger (mock del transport).
  - Review: grep de `logger.info(` sobre requests → no pasa cuerpos ni headers de auth.
  - (futuro) Alertas de ráfagas de 401/403 en logs (`crown-jewels.md` §P2).

### R10 — Sesiones y cookies seguras (P0 · cuando llegue auth · joya P0-sesiones)

- Cookie de sesión: `httpOnly`, `Secure` (producción), `SameSite=Lax` (o `Strict`), `Path=/`, expiración; rotación de identificador en login (anti session fixation) e invalidación en logout (`auth.md` §11.2).
- **Cómo se comprobará** (cuando exista Better Auth):
  - Test/inspección de headers de respuesta de `/auth/login`: cookie con flags `HttpOnly` y `SameSite`; en `production` también `Secure`.
  - Test: `POST /auth/logout` invalida la sesión (siguiente `GET /auth/session` → 401).
  - Test: `set-cookie` nunca contiene la contraseña ni el email.

### R11 — Enforcement server-side por rol/propietario (P0 · cuando lleguen endpoints · joya P0-acceso)

- Cada ruta verifica sesión y, donde aplique, rol/propiedad **por petición** (nunca confiar en el rol del cliente). IDOR horizontal (autor) y vertical (admin) bloqueados. Reglas de visibilidad del feed (publicado/borrador/oculto) aplicadas en la query, como ya define `src/lib/visibility.ts`.
- **Cómo se comprobará** (contract tests + tests de ruta):
  - `PATCH /posts/:id` de un post ajeno con sesión de otro autor → `403`.
  - `PATCH /admin/users/:id/role` con rol `estudiante` → `403`.
  - `GET /posts` con sesión X no devuelve `borrador`/`oculto` de otro autor (mismo contrato que `post-repository.contract.test.ts`).

### R12 — Registro seguro (P0 · esta entrega · joya P0-credenciales + P0-acceso)

- Validación `zod` **estricta en servidor** de cada regla de `auth.md` §4: `givenName`/`familyName` 2–60 (regex letras/espacio/`-`/`'`), `email` ≤ 254 normalizado a minúsculas, `password` 8–128 **sin `trim`**.
- **El rol no es editable por el cliente**: el body de registro solo acepta `givenName`, `familyName`, `email`, `password`; cualquier `role` enviado se **ignora** (el usuario nace `estudiante`).
- Unicidad de `email` y `username` (derivado). Conflicto → `409` con **cuerpo genérico idéntico** en ambos casos (anti-enumeración, joya P0). El `username` derivado se trunca a ≤ 50 y se sufija numéricamente en colisión.
- Hashing del proveedor: **Scrypt** (KDF memory-hard de Better Auth, equivalente a argon2id en objetivos de `auth.md` §11.2) — **desvío registrado**: no argon2id/bcrypt.
- Rate limiting por IP (R7) sobre `/auth/register`.
- **Cómo se comprobará**:
  - Test por cada regla de `auth.md` §4: payload inválido → `400` con detalle de campo.
  - Test: `email` existente → `409` genérico; `username` derivado colisiona → sufijo numérico (≤ 50); **el cuerpo 409 es idéntico en ambos casos**.
  - Test: body con `role: "admin"` → ignorado; el usuario creado queda `estudiante` (inspección vía `findById`).
  - Test: N+1 registros desde la misma IP → `429`.
  - Test/grep: el store no contiene contraseñas en texto plano y ninguna respuesta de auth las devuelve.
  - Test anti-timing: el hash señuelo (decoy) corre también cuando el email existe (misma ruta de coste).

### R13 — Login y sesión segura (P0 · esta entrega · joya P0-credenciales/sesiones)

- `401` **idéntico** para usuario inexistente y contraseña incorrecta (`{ "error": "invalid_credentials", "message": "El usuario o la contraseña no coinciden." }`). Comparación en tiempo constante; **hash señuelo asíncrono** con los mismos parámetros Scrypt del proveedor cuando el username no existe (`auth.md` §11.2).
- **Sesiones de BD en memoria (cookie opaca), NO stateless JWT — desvío H4 registrado**: Better Auth v1.7.7 no soporta sesiones realmente stateless (`session.cookieCache.strategy: "jwt"` solo cachea; la validación siempre consulta el store). La sesión se persiste en el `MemoryUserStore` (revocable: el `logout` la elimina) — **más segura que JWT** (revocación inmediata, sin JWT robado vigente 24 h), pero el modelo de amenaza se actualiza: no hay claim de rol stale (el rol es fresco por petición, R14) y la "verificación de firma del token" no aplica como en JWT.
- Expiración **24 h**; renovación deslizante (sliding, cada 8 h); **rotación** de la sesión en cada login (cookie sobrescrita, anti session fixation).
- Cookies: `httpOnly`, `SameSite=Lax`, `Secure` en producción, `Path=/`; `set-cookie` nunca contiene email ni contraseña.
- CSRF en todas las mutaciones (doble envío con cookie propia `facy.csrf_token` — **desvío registrado**: Better Auth no emite `better-auth.csrf_token`; + `SameSite` + `trustedOrigins` + chequeo de `Origin`).
- **Cómo se comprobará**:
  - Test de headers: flags `HttpOnly`/`SameSite` siempre; `Secure` solo en producción.
  - Test: login OK → `200` `Session` + cookie nueva; logout → `204` y `session` posterior → `401`.
  - Test: usuario inexistente vs. contraseña incorrecta → **exactamente el mismo** `401`.
  - Test: mutación con `Origin` presente y sin cookie/token CSRF → `403`.
  - Test: sesión expirada → `401`; sesión revocada (logout) → `401`.
  - Test (pino, mock transport): el body de login con `password` no aparece en la salida del logger.

### R14 — Autorización con rol fresco por petición (P0 · esta entrega · joya P0-acceso)

- El middleware `requireSession` resuelve la identidad por cookie (JWT) y **re-lee el rol del usuario del store en cada petición** (O(1) en memoria). La autorización **nunca confía en el claim `role` del JWT**: el claim es solo identidad, el rol es dato fresco.
- Consecuencia: el cambio de rol por admin (incluidas las transiciones entre `estudiante`/`profesor`; el rol `admin` es inmutable, R16) es efectivo de inmediato; sin esto, un JWT stateless mantendría un rol stale hasta la expiración.
- **Cómo se comprobará**:
  - Test: admin cambia el rol de X a `estudiante`; la sesión vigente de X (JWT con claim `role` viejo) pierde acceso a `/admin/*` de inmediato.
  - Test de robustez: token firmado con claim `role: "admin"` pero store con `estudiante` → `403` en `/admin/*` (prueba que el claim no autoriza).

### R15 — Posts: enforcement propietario/admin y visibilidad (P0 · esta entrega · joya P0-publicaciones + P0-acceso)

- `POST /posts`: autenticado; `authorId` **siempre de la sesión** (nunca del body).
- `PATCH`/`DELETE /posts/:id`: **autor o admin**; cualquier otro → `403` (IDOR horizontal y vertical bloqueados).
- `GET /posts/:id`: aplica `canViewPost`; post no visible para la sesión → `404` (no revelar existencia de `borrador`/`oculto` ajenos).
- Feed: réplica exacta de `src/lib/visibility.ts` (publicado → todos; borrador → autor; oculto → autor y admin; **admin NO ve borradores ajenos**).
- Validación `zod` de `title`/`content`/`category`/`type`/`visibility` (R8); `publishedAt` inmutable (lo gestiona el servidor).
- **Cómo se comprobará**:
  - Contract tests del feed: **9 combinaciones** de visibilidad (port de `src/lib/visibility.test.ts`).
  - Test: `PATCH`/`DELETE` de post ajeno → `403`; del propio → `200`/`204`; admin sobre cualquiera → `200`/`204`.
  - Test: `GET /posts/:id` de borrador ajeno → `404`; de borrador propio → `200`.
  - Test: body de creación con `authorId`/`role` inyectado → ignorado.
  - Test: payload inválido → `400` con detalle de campo.

### R16 — Admin: enforcement server-side por rol (P0 · esta entrega · joya P0-acceso)

- `/admin/*` exige rol `admin` verificado **en servidor por petición** (R14): `requireSession` + `requireRole("admin")`. Nunca del cliente.
- `PATCH /admin/users/:id/role`: solo admin; el rol no es aceptable desde ningún otro endpoint. `404` si el id no existe. **El rol `admin` es inmutable**: rechaza (`409`/`422`) toda transición que salga de `admin` — la propia (`admin → *`) y la de otro admin. Es una regla de autorización, no un conteo: al no admitirse ninguna democión de admin, no hay que consultar cuántos admins quedan ni hay carrera por el "último admin". Provisto por un control de producto (decisión 2026-10-09, `wireframes_admin.md` §1.4 D2); el alta/baja de administradores es operativa (seed/ambiente), no por API de usuario.
- `PATCH /admin/posts/:id/visibility`: solo admin; acepta `"publicado"`/`"oculto"` (única vía para fijar `oculto`). **Rechaza** (`409`/`422`) moderar una publicación en estado `borrador`: el endpoint no puede ser una vía para publicar material privado ajeno (R15; F-03 del review de `/admin`).
- **Cómo se comprobará**:
  - Test: `estudiante`/`profesor` llaman a cualquier `/admin/*` → `403`.
  - Test: admin cambia rol de otro a `profesor`/`estudiante`/`admin` → `204` y el rol efectivo cambia en el store (inmediatez verificada por R14).
  - Test: cambiar el rol de **cualquier** `admin` (incluido uno mismo) → `409`/`422` y **no** muta el store.
  - Test: moderar un post `borrador` ajeno → `409`/`422` sin publicar; `publicado ⇄ oculto` → `200` y el feed refleja el cambio; no-admin → `403`; id inexistente → `404`.
- **Estado (2026-10-29): implementado.** `set-user-role.ts` rechaza toda transición desde `admin_sistema` con `409 immutable_role` (propia o ajena) y `SetUserRoleSchema` ya no admite `admin_sistema` como destino, por lo que la API no puede crear administradores. La auditoría de cada cambio (`role_change`, sin PII) cubre D5. Tests en `admin.routes.test.ts`. Nota: los nombres de rol de este documento (`admin`, `estudiante`, `profesor`) son anteriores al pivot; los vigentes son `admin_sistema`, `coordinador` y `aprobador`.

### R17 — OpenAPI sin fuga y bloqueado en producción (P1 · esta entrega · joya P1-secretos)

- El documento OpenAPI solo refleja **formas wire** (`Post`, `PostPage`, `AuthorOption`, `Session`, `User`) y cuerpos de petición; sin secretos, valores de env, esquemas internos ni descripciones de infraestructura.
- `NODE_ENV=production` (o `OPENAPI_ENABLED=false`): `/api/v1/openapi.json` y `/api/v1/docs` responden `404` (joya P1: "bloquear `/docs`, `/openapi.json` en producción", `crown-jewels.md`).
- **Cómo se comprobará**:
  - Test: en `production` → `GET /api/v1/openapi.json` y `/docs` → `404`.
  - Test (dev): grep del documento — no contiene `secret`, claves de env, rutas internas (`src/`), ni valores reales.
  - Review: `security-reviewer` confirma que el esquema solo expone las formas wire.

### R18 — Perfiles y anti-enumeración (P1 · esta entrega · joya P0-credenciales + P1-API)

- `GET /users/:username`: username inexistente → `404` genérico (no revelar existencia).
- Email de un perfil **ajeno** redactado (`""`) salvo para el propio usuario o admin (no fugar PII de terceros).
- `GET /users/authors`: solo `AuthorOption` (`id`, `username`, `fullName`); **nunca** `email` ni `role`.
- **Cómo se comprobará**:
  - Test: username inexistente → `404` con cuerpo genérico (idéntico al de un perfil existente sin posts si se decidiera así).
  - Test: perfil ajeno → `email === ""`; propio → email completo; admin → email completo.
  - Test: `/users/authors` no incluye el campo `email`.

---

## 6. Prioridad y cronograma de controles

| Requisito | Prioridad | Cuándo | Joya |
| --- | --- | --- | --- |
| R1 CORS whitelist | P1 | scaffold | P1 API |
| R2 Errores sin fuga | P1 | scaffold | P1 API |
| R3 Límite de cuerpo | P1 | scaffold | P1 API |
| R4 Cabeceras de seguridad | P2 | scaffold | P2 hardening |
| R5 Secretos en env | P1 | scaffold | P1 secretos |
| R6 404 JSON | P1 | scaffold | P1 API |
| R7 Rate limiting auth | P0 | con auth | P0 credenciales |
| R8 Validación estricta | P0 | con endpoints | P0 publicaciones |
| R9 Logging seguro | P2 | scaffold+futuro | P2 hardening |
| R10 Cookies seguras | P0 | con auth | P0 sesiones |
| R11 Enforcement por rol | P0 | con endpoints | P0 acceso |
| R12 Registro seguro | P0 | esta entrega | P0 credenciales |
| R13 Login y sesión stateless | P0 | esta entrega | P0 credenciales/sesiones |
| R14 Rol fresco por petición | P0 | esta entrega | P0 acceso |
| R15 Posts: propietario/admin + visibilidad | P0 | esta entrega | P0 publicaciones/acceso |
| R16 Admin: enforcement server-side + rol `admin` inmutable | P0 | esta entrega | P0 acceso |
| R17 OpenAPI sin fuga / bloqueado en prod | P1 | esta entrega | P1 secretos |
| R18 Perfiles y anti-enumeración | P1 | esta entrega | P1 API |

---

## 7. Riesgos residuales y límites del modelo

- El **CORS** protege al navegador, no a clientes no-navegador: los endpoints autenticados deben validar sesión igualmente (R11).
- El **rate limiting en memoria** no escala a multi-instancia; aceptado para MVP, se migra a Redis en despliegue multi-replica (nota para `devops`).
- **Sesión stateless JWT**: un token robado sigue siendo válido hasta su expiración (24 h) salvo lista negra en memoria; mitigaciones: expiración corta + sliding, `httpOnly`/`Secure`, CSRF y rotación en login. La lista negra en memoria se pierde al reiniciar la API (aceptado para MVP; en PostgreSQL se podrá revocar de forma persistente).
- **Almacenamiento en memoria**: los datos de usuario/publicaciones/sesiones se pierden al reiniciar el proceso. Es coherente con el MVP y con la migración planificada a PostgreSQL; no es un almacén de producción durable.
- **Rol `admin` inmutable**: el lock-out por auto-democión dejó de ser riesgo residual — R16 lo convierte en **control** (ninguna transición sale de `admin`, decisión 2026-10-09). El alta/baja de administradores pasa a ser operativa (seed/ambiente); el `red-team` verificará que el endpoint rechaza toda salida de `admin` y que no existe vía de UI/API para crear o quitar el primer admin.
- **Suply chain (S10)**: mantener lockfile de `apps/api` versionado, `pnpm` con `allowBuilds` restringido (ya configurado en `pnpm-workspace.yaml`) y `pnpm audit` en CI (coordinación con `devops`).
- La **terminación TLS** es responsabilidad del proxy; la API asume que llega HTTPS en producción (los flags `Secure` de cookies dependen de ello).

## 8. Cómo se verificará en las fases del pipeline

- **Implementación**: el `developer` implementa R1–R6 (scaffold) en TDD y, en la entrega de auth+endpoints, R7, R8, R10, R11 y R12–R18 con los tests indicados en cada requisito.
- **Review**: `security-reviewer` y `qa-reviewer` validan cada requisito contra su "cómo se comprobará". Los requisitos P0 que tocan joyas de la corona bloquean la integración hasta su corrección (`crown-jewels.md` §5).
- **Testing**: `tester` documenta evidencia en `docs/tests/` (scaffold: health, CORS, 404, 413, headers, error sin stack; entrega: matriz de enforcement de `api-structure.md` §12.2 y cada "cómo se comprobará" de R12–R18).
- **Ofensiva/defensiva**: `red-team` auditará `apps/api` contra estas superficies (incluidos S5–S8 y S11); `blue-team` mitiga hallazgos. Hallazgos que toquen joyas P0 bloquean la integración (`crown-jewels.md` §5).