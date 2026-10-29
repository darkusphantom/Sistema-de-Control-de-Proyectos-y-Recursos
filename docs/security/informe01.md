# Informe de seguridad 01 — Sistema de Control de Proyectos y Recursos (Red FaCyT)

**Fecha:** 2026-10-29
**Emisor:** `security-reviewer` (auditoría, sin modificación de código)
**Alcance:** `apps/api` (Hono 4 + Better Auth 1.7.7), `apps/web` (Next.js 16 App Router), `packages/shared`, configuración de entorno, dependencias y documentación de seguridad.
**Documentos rectores:** [`crown-jewels.md`](crown-jewels.md) (prioridades P0/P1/P2) y [`threat-model-api.md`](threat-model-api.md) (requisitos R1–R18).
**Contexto de fase:** el backend **no está integrado** con el frontend. `apps/web` opera con adaptadores estáticos (`localStorage`) que simulan la API. Este informe separa, por tanto, **código real** de **código provisional**, y distingue entre riesgo **hoy** y riesgo **al liberar**.

---

## 0. Estado de remediación (2026-10-29)

Tras la autorización del usuario se ejecutaron las correcciones de código del informe. El detalle técnico y la evidencia están en [`docs/tests/security-remediation-01.md`](../tests/security-remediation-01.md).

| ID | Estado | Cómo quedó |
| --- | --- | --- |
| SR-01 | ✅ Corregido | `admin_sistema` inmutable en `set-user-role.ts` (409 `immutable_role`); el enum de destino ya no admite `admin_sistema`; la UI de `/admin` no ofrece esa opción. |
| SR-03 | ✅ Corregido | `next@16.4.3`, `eslint-config-next@16.4.3`, `zod@^4.6.7`; `undici` forzado a `8.12.2`. |
| SR-04 | 🟡 Parcial | `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS en producción y CSP **`Report-Only`**. El CSP enforcing con nonce se difiere a la integración (fuerza render dinámico). |
| SR-05 | ✅ Corregido | `avatarUrl` validado en el servidor con `avatarDataUrlSchema`; se rechazan URLs externas y data URLs que no sean PNG/JPEG. |
| SR-09 | ✅ Corregido | El secreto de desarrollo se rechaza con `NODE_ENV=production`; `OPENAPI_ENABLED` pasa a `false` por defecto; `CORS_ORIGINS` se valida al arranque. |
| SR-10 | ✅ Corregido | `Cache-Control: no-store` global en la API. |
| SR-11 | ✅ Corregido | Auditoría `role_change` con `actorId`, `targetUserId`, `roleBefore`, `roleAfter` y `requestId`; sin PII. |
| SR-14 | ✅ Corregido | `.env.example` del web sin cadena de conexión con credenciales. |
| SR-15 | ✅ Corregido | `.github/workflows/ci.yml`: lint, cobertura, build, `pnpm audit --prod --audit-level=high`, gitleaks y gate de adaptadores estáticos. |
| SR-16 | ✅ Corregido | Composition root en `lib/auth/index.ts` y `lib/repositories/index.ts`; los 9 puntos de instanciación quedan en 2. |
| B-01 | ✅ Corregido | CSRF compara con `timingSafeEqual`. |
| B-03 | ✅ Corregido | El log de login fallido ya no incluye username ni email. |
| B-06 | ✅ Corregido | Orígenes CORS canónicos y resueltos con `Set` (O(1) por request). |
| B-08 | ✅ Corregido | `poweredByHeader: false`. |
| SR-02, SR-06, SR-07, SR-12 | ⏳ Diferido | Requieren la integración real (sesión server-side, endpoint de contraseña, persistencia). |
| SR-08, SR-13 | ⏳ Diferido | Decisión de producto / `security-architect`. |

**Tres correcciones a este informe:**

1. **`allowBuilds` sí es un campo válido de pnpm 11** (§SR-14 de la versión original lo daba por inexistente). La configuración del repo era correcta; se mantiene y se documenta. El campo obsoleto es `onlyBuiltDependencies`.
2. **M-1 se implementó como guard de runtime, no a nivel de módulo.** Un `throw` en el módulo habría roto cualquier `next build`, incluido un demo. Ahora los mutadores fallan y `getSession()` devuelve `null` en producción, y el gate de CI impide publicar la maqueta.
3. **`pnpm audit --prod` pasa de 20 avisos a 1 low** (esbuild, dev server en Windows): el resto eran transitivos de `jsdom`/`vitest`, resueltos con un override de `undici`.

---

## 1. Resumen ejecutivo

| Severidad | Total | IDs |
| --- | --- | --- |
| 🔴 Crítico **activo** (código real) | 2 | SR-01, SR-03 |
| 🔴 Crítico **diferido** (bloquea liberación) | 2 | SR-02, SR-09 |
| 🟡 Advertencia | 12 | SR-04 … SR-16 |
| 🔵 Sugerencia | 8 | B-01 … B-08 |

**Diagnóstico.** El backend (`apps/api`) tiene una base de seguridad superior a la media de un MVP: CORS con whitelist probada, errores genéricos, límite de cuerpo, cabeceras, validación Zod en servidor, rol fresco por petición, Scrypt con señuelo anti-timing, CSRF de doble envío, OpenAPI bloqueado en producción, redacción de email ajeno y 127 tests en verde. El frontend está en **fase de maqueta**: la sesión y el rol viven en `localStorage` y **toda** la autorización es del cliente. Eso es aceptable como simulación, pero **no puede sobrevivir al día en que exista backend**.

**Dos hechos dominan el informe:**

1. La regla de negocio más sensible del dominio — **`admin_sistema` es inmutable** — está escrita en `crown-jewels.md` §P0 y en el modelo de amenaza (R16), **no está implementada en la API** y **un test afirma lo contrario** (`admin.routes.test.ts:61`). No depende de la fase del backend.
2. El desplegable (`apps/web`) arrastra **2 CVE críticos y 2 altos** de `next@16.3.6`, y `apps/api` usa `zod@4.6.5` con un CVE alto de agotamiento de memoria. Es el hallazgo más barato de corregir del informe.

**Veredicto:** la API **no es apta para integración** mientras SR-01 siga abierto; el frontend **no es apto para producción** mientras SR-02 no se cierre con sesión server-side. El resto es deuda gestionable con un plan de tres tramos (§10).

---

## 2. Metodología y evidencia

| Actividad | Resultado |
| --- | --- |
| Lectura íntegra de `apps/api` (rutas, casos de uso, middleware, adaptadores, config) | 14 archivos de test, 127 tests ejecutados: **127/127 PASS** |
| Lectura íntegra de `apps/web` (auth, sesión, repositorios, Server Actions, guardas, admin) | Adaptadores estáticos identificados en 9 puntos de instanciación |
| Contrastación código ↔ documentación de seguridad | R16 incumplido; R15 obsoleto tras el pivot |
| `pnpm audit --prod` (2026-10-29) | 20 advisories: **2 critical, 7 high, 9 moderate, 2 low** |
| Revisión de árbol git y `.gitignore` | Sin secretos versionados; `.env*` ignorado; solo `.env.example` |
| Revisión de BD | **No aplica**: el repositorio no contiene PostgreSQL/Supabase (Fase 5) |
| Verificación de versiones instaladas | `next 16.3.6`, `zod 4.6.5`, `hono 4.13.13`, `better-auth 1.7.7`, `@hono/node-server 2.1.3`, `pino 9.14.0` |

**Limitaciones:** no se ejecutó pentesting dinámico (corresponde a `red-team`); no se auditaron dependencias de desarrollo con impacto en producción; la revisión del modelo de datos del nuevo dominio no es posible porque aún no existe.

---

## 3. Reclasificación respecto a la fase estática

La primera pasada del análisis evaluó todo el árbol como si fuera producción. Corregido el contexto (backend no integrado, `localStorage` como simulación deliberada), la severidad se recalibra:

| Hallazgo | Severidad inicial | Severidad corregida | Motivo |
| --- | --- | --- | --- |
| SR-01 `admin_sistema` mutable | 🔴 | **🔴 sin cambios** | Código backend real, no mock |
| SR-03 CVEs de `next`/`zod` | 🔴 | **🔴 sin cambios** | El artefacto desplegable es `apps/web` |
| SR-09 `NODE_ENV` fail-open | 🟡 | **🔴 al desplegar la API** | Hoy no hay despliegue; el fallo es silencioso |
| SR-02 sesión en `localStorage` | 🔴 | **🟡 fase mock / 🔴 puerta de salida** | Simular así es legítimo; heredarlo a producción no |
| SR-06 cambio de contraseña sin verificar la actual | 🟡 | **🟡 documentado** (PR-2) | Ya es requisito de release en `wireframes_profile.md` §2.9 |
| SR-05 `avatarUrl` sin validar | 🟡 | **🟡 real** | El validador es compartido y viajará al backend |
| SR-08 enumeración de correo | 🟡 | **🔵 hoy / 🟡 con cuentas reales** | Sin usuarios reales no hay nada que enumerar |
| SR-07 / SR-10 / SR-12 rate limit, `no-store`, DoS | 🟡 | **🟡 en Fase 5** | Ya son código de API; importan cuando esté expuesta |
| SR-13 modelo de amenaza obsoleto | 🟡 | **🟡 agendado a Fase 3** | Debe regenerarse con el nuevo dominio |
| SR-14 credenciales en `.env.example` | 🟡 | **🔵** | Trivial, pero es un default que se copia |
| SR-15 sin CI ni audit | 🟡 | **🟡 sin cambios** | Es lo que habría atrapado SR-03 |

---

## 4. Hallazgos críticos activos 🔴

### SR-01 · El rol `admin_sistema` NO es inmutable en la API

**Severidad:** 🔴 Crítico · **Componente:** `apps/api` · **Estado:** Abierto · **Joya afectada:** P0 — Cuentas y control de acceso por rol
**Evidencia:** `apps/api/src/application/admin/set-user-role.ts:19-25` · `apps/api/src/routes/admin.routes.ts:26-39` · `packages/shared/src/schemas/auth.ts:84-85` · `apps/api/src/routes/admin.routes.test.ts:61-88` · `apps/web/src/lib/admin/moderation.ts:11-13`

**Hecho.** `setUserRole()` ejecuta `deps.users.updateRole(id, role)` sin ninguna comprobación previa. `SetUserRoleSchema` acepta `"admin_sistema"` como rol de destino. El test `demoting an admin is effective immediately (fresh role, no stale claim)` **asserta 204 al demotar a un administrador**, es decir, el test codifica el comportamiento inseguro.

**Contradicción documental.** `crown-jewels.md` §P0 y `threat-model-api.md` R16 exigen literalmente: «el endpoint rechaza toda transición que salga de `admin_sistema`» y «ningún `admin_sistema` puede cambiar de rol (ni a sí mismo ni a otro)». La única implementación de esa regla vive en el **cliente** (`canChangeRole`, `moderation.ts:11-13`), que no es enforcement. Adicionalmente, la decisión D5 (`wireframes_admin.md`, 2026-10-09) define que el alta/baja de administradores es **operativa** (seed), sin UI ni endpoint; por tanto, perder el último admin es irrecuperable desde la aplicación.

**Impacto.**

- Un `admin_sistema` (o una sesión de admin robada) puede **demotar a todos los administradores**, incluido el último → *lock-out* permanente del panel, recuperable solo con intervención manual sobre el almacén.
- Puede **promover a cualquier usuario a `admin_sistema`** sin posibilidad de revertirlo después (la regla de inmutabilidad impediría la salida una vez implementada).
- Sin auditoría de cambios de rol (SR-11), la escalada es **invisible** en los logs.

**Recomendación.** Aplicar la regla en el **caso de uso** (no en la ruta), devolver `409` y corregir el test:

```ts
// apps/api/src/application/admin/set-user-role.ts
export function setUserRole(deps: SetUserRoleDeps) {
  return async (id: string, role: UserRole): Promise<void> => {
    const target = await deps.users.findById(id);
    if (!target) throw new NotFoundError();
    if (target.role === "admin_sistema") {
      throw new ConflictError(
        "El rol de administrador del sistema es inmutable",
        "immutable_role",
      );
    }
    await deps.users.updateRole(id, role);
  };
}
```

Y restringir el enum de destino en `SetUserRoleSchema` a `["coordinador", "aprobador"]`. `admin.routes.test.ts:61-88` debe pasar a esperar `409` y a verificar que el rol del objetivo **no cambió**.

---

### SR-03 · Dependencias con CVE crítico: `next@16.3.6` y `zod@4.6.5`

**Severidad:** 🔴 Crítico · **Componente:** `apps/web` + `apps/api` · **Estado:** Abierto · **Joya afectada:** P0 (compromiso total del host)
**Evidencia:** `apps/web/package.json:14` (`next 16.3.6`) · `apps/api/package.json:25` (`zod ^4.6.5` → instalado 4.6.5) · `pnpm audit --prod` del 2026-10-29

**Hecho.**

| Sev. | Paquete | Rango vulnerable | Parche | Advisory |
| --- | --- | --- | --- | --- |
| 🔴 | `next` | `>=16.0.0 <=16.4.0` | `>=16.4.1` | RCE no autenticado en Image Optimization API con SVG |
| 🔴 | `next` | `>=16.0.0 <=16.4.0` | `>=16.4.1` | RCE no autenticado en `use cache` con typed arrays |
| 🟠 | `next` | `>=16.0.0 <16.3.8` | `>=16.3.8` | SSRF en Image Optimization |
| 🟠 | `next` | `>=16.0.0 <=16.4.0` | `>=16.4.1` | DoS en App Router vía Server Actions |
| 🟠 | `zod` | `<4.6.6` | `>=4.6.6` | Agotamiento de memoria validando colecciones con `max` |
| 🟠 | `undici` | `>=8.0.0 <8.12.2` | `>=8.12.2` | DoS por `content-encodings` (ruta de test: `jsdom`) |
| 🟡 | varios | — | — | Cache poisoning / SSG / ISR / `use cache` leaks |

**Matiz de explotabilidad.** El proyecto **no** usa `next/image`, ni `use cache`, ni `dangerouslyAllowSVG`; por configuración actual los dos RCE no son alcanzables. Sin embargo: `/_next/image` se expone por defecto, el advisory de DoS en Server Actions **sí es relevante** (el proyecto ya usa una Server Action) y el resto no requiere features especiales. Un framework con CVEs críticos sin parchear no es aceptable en un sistema que gestionará datos presupuestarios.

**Recomendación.** `next` → `>=16.4.1`; `zod` → `>=4.6.6`; regenerar lockfile; ejecutar `pnpm -r lint`, `pnpm -r test`, `pnpm -r build` tras el bump (Next 16.4 puede introducir cambios) y añadir `pnpm audit --audit-level=high` al gate (SR-15).

---

## 5. Hallazgos críticos diferidos 🔴 (bloquean liberación)

### SR-02 · Sesión y rol en `localStorage`; autorización 100 % en cliente

**Severidad:** 🟡 en fase estática → **🔴 puerta de salida** · **Componente:** `apps/web` · **Estado:** Aceptado por diseño, requiere control de salida
**Evidencia:** `apps/web/src/lib/auth/auth-gateway.static.ts:13,30,74` · `apps/web/src/lib/session/session-provider.tsx:31,64-81` · `apps/web/src/components/admin/admin-view.tsx:30,48` · `apps/web/src/components/auth/auth-guard.tsx:7` · ausencia de `apps/web/src/middleware.ts`

**Hecho.** El login acepta **cualquier contraseña no vacía** para un usuario existente y persiste en `localStorage` un objeto `Session` que incluye `role`. `SessionProvider`, `AuthGuard` y `AdminView` deciden el acceso leyendo ese objeto. No existe middleware ni comprobación server-side de rutas.

**Impacto actual (fase mock).** Escribir en consola

```js
localStorage.setItem("facy:session", JSON.stringify({
  user: { id: "u-1", username: "admin", role: "admin_sistema" },
  expiresAt: "2099-01-01T00:00:00.000Z",
}));
```

concede acceso al panel `/admin` y a cualquier ruta de `(main)`. El daño es acotado: los datos son fixtures y las mutaciones viven en memoria del proceso.

**Impacto al conectar la API.** Bypass total de autenticación y autorización; cualquier XSS pasa a ser suplantación de identidad con escalada a `admin_sistema`, porque el rol es un campo editable por el atacante.

**Recomendación (obligatoria antes de Fase 5).**

1. Sustituir el adaptador estático por sesión en cookie `HttpOnly` emitida por `apps/api`.
2. Resolver la sesión **en servidor** (Server Components + `middleware.ts` protegiendo `(main)` y `admin`).
3. Validar `admin_sistema` server-side en cada petición; nunca leer `role` del cliente.
4. Mantener las guardas de cliente solo como UX.

---

### SR-09 · Configuración *fail-open*: `NODE_ENV` por defecto `development`

**Severidad:** 🟡 hoy → **🔴 al desplegar la API** · **Componente:** `apps/api` · **Estado:** Abierto
**Evidencia:** `apps/api/src/config/env.ts:14,20,22,32,41-45,56-62,76`

**Hecho.** Si en producción falta `NODE_ENV`, la aplicación arranca como `development`:

- usa el **secreto de desarrollo conocido** (`BETTER_AUTH_SECRET` por defecto);
- emite cookies **sin `Secure`** (`advanced.useSecureCookies` depende de `isProduction`);
- habilita `/api/v1/openapi.json` y `/docs`;
- devuelve `detail` con el mensaje interno en las respuestas 500.

La validación de producción solo comprueba `undefined`: si alguien define `BETTER_AUTH_SECRET` con el valor de ejemplo (≥ 32 caracteres), pasa la validación.

**Recomendación.** `NODE_ENV` sin `default` (fail-fast) o un `APP_ENV` explícito; `refine` que rechace en producción el secreto de ejemplo; `OPENAPI_ENABLED` por defecto `false`; `HOST` por defecto `127.0.0.1` salvo override explícito.

---

## 6. Hallazgo estructural de la fase mock 🟡

### SR-16 · Los puertos hexagonales existen, pero no hay raíz de composición

**Severidad:** 🟡 · **Componente:** `apps/web` · **Estado:** Abierto
**Evidencia:** 9 puntos de instanciación directa del adaptador concreto:

| Archivo | Instancia |
| --- | --- |
| `apps/web/src/components/forms/login-form.tsx:13` | `new StaticAuthGateway()` |
| `apps/web/src/components/forms/register-form.tsx:19` | `new StaticAuthGateway()` |
| `apps/web/src/components/auth/auth-guard.tsx:7` | `new StaticAuthGateway()` |
| `apps/web/src/lib/session/session-provider.tsx:31` | `new StaticAuthGateway()` |
| `apps/web/src/app/(main)/profile/[username]/page.tsx:6-7` | `new StaticUserRepository()` + gateway |
| `apps/web/src/app/(main)/profile/actions.ts:8-9` | `new StaticUserRepository()` + gateway |
| `apps/web/src/app/(main)/dashboard/page.tsx:12` | `new StaticDashboardRepository()` |

**Hecho.** Los docstrings afirman que cambiar de adaptador «no requiere cambios en los consumidores» (`dashboard-repository.ts`, `user-repository.ts`). El código dice lo contrario: cada consumidor importa el adaptador estático concreto.

**Impacto.** Hoy el cambio cuesta ~1 hora (extraer tres factories). En Fase 5, el mismo cambio exige tocar siete archivos —dos de ellos Server Actions— en el mismo commit que conecta la autenticación real. Ese es exactamente el escenario donde se cuela un `localStorage` residual en producción.

**Recomendación.** Un módulo de composición por puerto y un solo punto de importación:

```ts
// apps/web/src/lib/auth/index.ts
import { StaticAuthGateway } from "./auth-gateway.static";
// import { ApiAuthGateway } from "./auth-gateway.api"; // Fase 5

export const authGateway: AuthGateway = new StaticAuthGateway();
```

Los consumidores pasan a `import { authGateway } from "@/lib/auth"`. Verificación en CI: `grep -r "StaticAuthGateway" apps/web/src` solo debe devolver la factory.

---

## 7. Advertencias 🟡

### SR-04 · El frontend no emite ninguna cabecera de seguridad

**Evidencia:** `apps/web/next.config.ts:4-8` (solo `outputFileTracingRoot` y `transpilePackages`). Sin `headers()`, sin CSP, sin HSTS, sin `X-Frame-Options`, sin `X-Content-Type-Options`; `X-Powered-By` activo.
**Impacto.** Sin CSP, un XSS tiene impacto máximo (roba `localStorage`, es decir, la sesión completa — SR-02). Sin `frame-ancestors`/`X-Frame-Options` hay clickjacking sobre acciones de aprobación. Sin HSTS, el primer acceso es degradable.
**Nota técnica.** `apps/web/src/app/layout.tsx:43-46` usa `dangerouslySetInnerHTML` con `THEME_BOOTSTRAP_SCRIPT`. Es una constante estática (no hay inyección), pero obliga a que la CSP use `nonce`/`hash` para ese script inline.
**Recomendación.** `poweredByHeader: false` + `headers()` con HSTS, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`; CSP con nonce en middleware: `default-src 'self'`, `script-src 'self' 'nonce-…'`, `img-src 'self' data:`, `connect-src 'self' <API>`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`.

---

### SR-05 · `avatarUrl` no se valida en servidor y viaja en un input oculto manipulable

**Evidencia:** `apps/web/src/app/(main)/profile/actions.ts:28` · `apps/web/src/lib/validation/profile.ts:34-58` · `apps/web/src/components/profile/avatar-uploader.tsx`
**Hecho.** `validateUpdateProfile` valida nombre, apellido, email y bio, pero **ignora `avatarUrl`**. El valor llega desde `<input type="hidden" name="avatarUrl">`, editable con DevTools, y se persiste tal cual. El esquema `avatarDataUrlSchema` existe en `@redfacyt/shared` (prefijo `data:image/png|jpeg` + tope), pero **no se aplica en el servidor**.
**Impacto.** Se puede almacenar cualquier cadena (URL externa de *tracking*, `data:text/html…`, contenido arbitrario). Con `<img src>` no hay ejecución de JS hoy, pero se rompe la minimización de contenido y será explotable en cuanto otro consumidor interprete el campo de otra forma. Además, el tope de 5 MB excede el límite de cuerpo de Server Actions de Next (1 MB por defecto): las fotos grandes fallan con error genérico.
**Recomendación.** `avatarDataUrlSchema.safeParse` en la Server Action; límite real ≈ 750 KB para data URL (o subida multipart con *magic bytes* + re-codificación sin EXIF, requisitos PR-2/PR-3 ya documentados); `img-src 'self' data:` en CSP.

---

### SR-06 · Server Actions de perfil: sesión inservible en servidor y cambio de contraseña sin verificar la actual

**Evidencia:** `apps/web/src/app/(main)/profile/actions.ts:12,41,67` · `apps/web/src/lib/auth/auth-gateway.static.ts:74,100`
**Hecho 1.** `getSession()` devuelve `null` cuando `typeof window === "undefined"`. Una Server Action siempre corre en servidor, luego `updateProfileAction`, `changePasswordAction` y `removeAvatarAction` **siempre** responden «Debes iniciar sesión». La edición de perfil está funcionalmente muerta (falla cerrado, que es lo correcto).
**Hecho 2.** `changePassword()` devuelve `success: true` sin verificar `currentPassword` (marcado `TODO` en el código). Si ese adaptador se conecta tal cual, cualquier sesión —o cualquier XSS— cambia la contraseña sin conocer la actual.
**Impacto.** Hoy: funcionalidad rota y diseño de autorización dependiente de un store de cliente. Mañana: toma de cuenta.
**Recomendación.** No conectar el adaptador tal cual (requisito de release PR-2). Mover el cambio de contraseña al API (`auth.api.changePassword` verifica la actual por diseño de Better Auth) y exigir sesión server-side.

---

### SR-07 · Rate limiting de login insuficiente y dependiente de `X-Forwarded-For`

**Evidencia:** `apps/api/src/routes/auth.routes.ts:57,126` · `apps/api/src/config/env.ts:41-43` · `apps/api/src/middleware/rate-limit.ts:18,87,117,175`
**Hecho.** `RATE_LIMIT_MAX=100` por ventana de 60 s (por IP y por username), ventana fija, **sin backoff exponencial** ni bloqueo progresivo. Solo cuentan los fallos (correcto), pero 100 fallos/min/usuario equivalen a ~144 000 intentos/día por cuenta. El contador es en memoria (se reinicia con el proceso) y la identidad de IP usa el primer hop de `XFF` como señal secundaria: si el proxy no lo sobrescribe, un atacante rota el header y evade el límite por IP.
**Impacto.** Fuerza bruta de contraseñas débiles y *password spraying* viables; el límite por username permite además bloquear la cuenta de una víctima durante la ventana (DoS de login).
**Recomendación.** ≤10 fallos/15 min por `username` y ≤50/h por IP, backoff exponencial, `Retry-After`; persistencia (Redis/PostgreSQL) en multi-instancia; confirmar en despliegue que el proxy **sobrescribe** `X-Forwarded-For`.

---

### SR-08 · Enumeración de correos en el registro

**Evidencia:** `apps/api/src/application/auth/register-user.ts:135-141` · `apps/web/src/lib/auth/auth-gateway.static.ts:46`
**Hecho.** Email existente → `409 account_conflict`; registro nuevo → `201`. El cuerpo genérico no evita que el código de estado revele existencia. El gateway estático lo hace explícito: `fieldErrors.email = "Ya existe una cuenta con ese correo."`.
**Impacto.** Hoy nulo (sin cuentas reales). Con usuarios reales: enumeración de la base de correos institucionales.
**Recomendación.** Respuesta uniforme `202` con el mismo cuerpo en ambos casos, o aceptar el riesgo formalmente en el modelo de amenaza y limitar por IP. Retirar el mensaje diferenciado del cliente.

---

### SR-10 · Respuestas autenticadas sin `Cache-Control: no-store`

**Evidencia:** `apps/api/src/app.ts:78-84` (pipeline sin cabecera de caché) · `apps/api/src/routes/users.routes.ts:26,35`
**Hecho.** `/auth/session`, `/users/:username` y `/users/coordinadores` devuelven PII (nombre, email propio, rol) sin `no-store`.
**Impacto.** Riesgo de que PII quede en cachés de navegador o proxies intermedios.
**Recomendación.** `Cache-Control: no-store` + `Vary: Cookie` en todas las rutas autenticadas.

---

### SR-11 · Sin auditoría ni logging de cambios de rol (D5)

**Evidencia:** `apps/api/src/application/admin/set-user-role.ts` (el caso de uso no recibe `actorId` ni logger)
**Hecho.** No se registra `actorId, targetUserId, roleBefore, roleAfter, timestamp, requestId`, requisito D5 ya decidido y pendiente en `progress.md`.
**Impacto.** Combinado con SR-01, una escalada de privilegios es indetectable; tampoco hay evidencia para una investigación posterior.
**Recomendación.** Log estructurado en el caso de uso (sin PII más allá de identificadores) y alerta sobre `403`/`409` repetidos en `/admin/*`.

---

### SR-12 · DoS por memoria/CPU en endpoints públicos de autenticación

**Evidencia:** `apps/api/src/infrastructure/repositories/in-memory/user-store.ts:78,90` · `apps/api/src/infrastructure/auth/memory-auth-adapter.ts:260` · `apps/api/src/application/auth/password-decoy.ts`
**Hecho.** El store en memoria no tiene poda programada de sesiones expiradas: `deleteMany` está implementado en el adaptador pero **no se invoca desde ningún punto de la aplicación**; cada login crea un registro de sesión y cada registro un usuario, sin techo global. La derivación Scrypt usa los parámetros por defecto de Better Auth (≈32 MiB por operación con `N=16384, r=16`, según `128·N·r`; conviene confirmar los parámetros efectivos en la versión instalada).
**Impacto.** `/auth/register` es público: con 100 registros/min/IP y múltiples IPs (o `XFF` rotado) se puede agotar memoria y CPU del proceso.
**Recomendación.** Semáforo global de concurrencia para el hashing, poda periódica de sesiones expiradas y rate limit distribuido; en PostgreSQL, TTL y limpieza programada.

---

### SR-13 · El modelo de amenaza está desactualizado respecto al pivot

**Evidencia:** `docs/security/threat-model-api.md` (R15 «Posts», roles `estudiante/profesor/admin`, endpoints `/posts`)
**Hecho.** R15 ya no existe y el rol `admin` fue sustituido por `admin_sistema`. La gobernanza de `crown-jewels.md` §4 exige que el modelo refleje el sistema real.
**Impacto.** La única regla P0 explícita del panel admin (inmutabilidad) está en el documento y no en el código (SR-01); un modelo obsoleto da falsa cobertura.
**Recomendación.** Que `security-architect` regenere el modelo para el dominio de proyectos y marque explícitamente qué requisitos R1–R18 sobreviven al pivot. Agendar en Fase 3.

---

### SR-14 · Credenciales por defecto en el `.env.example` del web

**Evidencia:** `apps/web/.env.example:10` → `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/red_facyt`
**Hecho.** Normaliza el par `postgres:postgres`. El `.env.example` de la API sí usa placeholder vacío.
**Impacto.** Si se copia a producción sin editar, es compromiso directo de la base de datos (joya P0).
**Recomendación.** Dejar `DATABASE_URL=` vacío con el formato en comentario.

---

### SR-15 · El gate de calidad no incluye controles de seguridad ni CI

**Evidencia:** `.husky/pre-commit:5-6` (solo `pnpm -r lint` + `pnpm -r test:coverage`) · ausencia de `.github/` · `pnpm-workspace.yaml:4-7`
**Hecho.** No hay CI ni análisis de dependencias/secretos. `allowBuilds` no es un campo de pnpm (`onlyBuiltDependencies` es el correcto), por lo que la restricción de scripts de instalación no está aplicando.
**Impacto.** Nada impide introducir una dependencia con CVE crítico (SR-03) ni comitear un `.env` con secretos.
**Recomendación.** CI con `pnpm audit --audit-level=high`, `gitleaks`, `lint`, tests y build; corregir `onlyBuiltDependencies` (`esbuild`, `sharp`).

---

## 8. Sugerencias 🔵

| ID | Ubicación | Observación |
| --- | --- | --- |
| B-01 | `apps/api/src/middleware/csrf.ts:24` | `Buffer.equals` no garantiza comparación en tiempo constante; usar `crypto.timingSafeEqual` tras igualar longitudes. |
| B-02 | `apps/api/src/middleware/csrf.ts:89-94` | Cookie CSRF sin prefijo `__Host-` y sin rotación tras login; aceptar el riesgo o rotar el token al autenticar. |
| B-03 | `apps/api/src/application/auth/sign-in.ts:70-73` | Se registra `username` en cada login fallido (PII; joya P2 «logging seguro»). Registrar solo `userId` si existe o un hash del username. |
| B-04 | `apps/api/src/routes/users.routes.ts:26,35` | `/users/coordinadores` sin rate limit: una cuenta válida puede raspar todo el directorio. |
| B-05 | `apps/api/src/infrastructure/auth/auth.config.ts:71,87` | `role` es `type: "string"` sin enum y `validateSchema: false`; validar el rol en el adaptador o al leerlo (defensa en profundidad). |
| B-06 | `apps/api/src/config/env.ts:22` | `CORS_ORIGINS` no valida que cada entrada sea un origen absoluto; `"*"` pasaría el esquema (Hono falla cerrado, Better Auth podría no). |
| B-07 | `apps/api` | No hay endpoint de cambio de contraseña ni verificación de email (`emailVerified` nunca se exige): sin rotación ni recuperación de credenciales. |
| B-08 | `apps/web/next.config.ts` | Falta `poweredByHeader: false` (además de SR-04). |

---

## 9. Contrato de seguridad de la fase mock

Cuatro reglas para que la simulación no se convierta en deuda estructural:

1. **Ningún componente lee `localStorage` directamente.** Solo el adaptador. *(Se cumple; `theme.ts` y `onboarding.ts` son stores de UI, no de identidad.)*
2. **Ningún componente decide autorización.** `canChangeRole`, `AuthGuard` y el guard de `/admin` son UX. El comentario `// double check` de `admin-user-row.tsx:22` sugiere lo contrario y conviene corregir el mensaje.
3. **Un único punto de instanciación por puerto** (SR-16).
4. **El mock falla cerrado.** Ya ocurre en las Server Actions (devuelven error).

### Riesgos intrínsecos del mock

| # | Riesgo | Mitigación |
| --- | --- | --- |
| M-1 | El login falso acepta cualquier contraseña y puede compilarse en producción | Guard de build en el adaptador (abajo) |
| M-2 | `mockUsers` es un array de módulo **mutable en el bundle de servidor**: el estado se comparte entre todos los usuarios en un proceso de larga vida y se pierde en serverless | Documentar la limitación; no construir lógica que dependa de él |
| M-3 | Las Server Actions de perfil son inalcanzables (`getSession()` = `null` en servidor) | Registrar en `progress.md` para que no se reporte como bug |
| M-4 | La interfaz `AuthGateway` no encaja con el backend real: devuelve `Session` (con `role`) al cliente y `getSession()` se llama desde el cliente | Rediseñar el contrato a `signIn(): Promise<{ok:true} o {ok:false, error}>` y resolver la sesión solo en servidor |

**Mitigación de M-1 (10 minutos, alto valor):**

```ts
// apps/web/src/lib/auth/auth-gateway.static.ts
if (process.env.NODE_ENV === "production") {
  throw new Error("StaticAuthGateway no es apto para producción");
}
```

En un Client Component, `process.env.NODE_ENV` se inlinea en build, de modo que esto **rompe el build de producción** si alguien deja el adaptador estático activo. Es la mejor red de seguridad disponible hoy.

---

## 10. Plan de remediación

### Tramo A — Ahora (independiente del backend)

| # | Acción | Esfuerzo | Motivo |
| --- | --- | --- | --- |
| A1 | Guard de producción en `StaticAuthGateway` (y en `canChangeRole`/`AdminView`) | ~30 min | Impide que la maqueta sea un bypass de auth en un deploy accidental |
| A2 | Factories de composición para `AuthGateway`, `UserRepository`, `DashboardRepository` | ~1 h | Evita el «commit gigante de integración» en Fase 5 |
| A3 | `pnpm audit` + `gitleaks` en pre-commit y CI | ~1 h | Habría detectado SR-03 automáticamente |
| A4 | Bump `next ≥ 16.4.1`, `zod ≥ 4.6.6` + verificación de build | ~1-2 h | Único crítico de coste bajo |
| A5 | Validar `avatarUrl` con `avatarDataUrlSchema` en la Server Action | ~20 min | El validador ya existe |
| A6 | `.env.example` del web sin `postgres:postgres` | 2 min | Evita un default peligroso |
| A7 | Registrar en `progress.md` las limitaciones del mock y este informe | ~20 min | Regla de documentación post-implementación |

### Tramo B — Antes de conectar el frontend a la API / desplegar

| # | Acción |
| --- | --- |
| B1 | **SR-01** — inmutabilidad de `admin_sistema` en el caso de uso + corregir el test que afirma lo contrario |
| B2 | **SR-02** — sesión server-side por cookie `HttpOnly` + `middleware.ts` + guard de `/admin` en servidor |
| B3 | **SR-06** — retirar del release el cambio de contraseña que no verifica la actual, o moverlo al API |
| B4 | **SR-09** — env *fail-closed* (`NODE_ENV`, secretos, `OPENAPI_ENABLED`) |
| B5 | **SR-04** — CSP con nonce, HSTS, `frame-ancestors`, `poweredByHeader: false` |
| B6 | **SR-16** — verificación en CI de que no quedan adaptadores estáticos cableados |
| B7 | **SR-10 / SR-11** — `no-store` y auditoría de cambios de rol |

### Tramo C — Fase 5 (con PostgreSQL y API expuesta)

| # | Acción |
| --- | --- |
| C1 | **SR-07 / SR-12** — rate limit reforzado, backoff, persistencia y poda de sesiones |
| C2 | **SR-08** — respuesta uniforme en registro si se mantienen cuentas reales |
| C3 | **SR-13** — modelo de amenaza regenerado para el dominio de proyectos |
| C4 | **SR-14 / SR-15** — secretos y CI en el pipeline de despliegue |
| C5 | Backlog de sugerencias B-01 … B-08 |

---

## 11. Puerta de salida (checklist de liberación)

- [ ] `grep -r "StaticAuthGateway" apps/web/src` solo devuelve factories.
- [ ] Sesión resuelta en servidor; `middleware.ts` protege `(main)` y `admin`.
- [ ] `/admin` valida `admin_sistema` server-side por petición.
- [ ] El cliente nunca recibe el rol desde un store mutable.
- [ ] SR-01 (inmutabilidad) implementado y testeado en la API.
- [ ] SR-03 (`next ≥ 16.4.1`, `zod ≥ 4.6.6`) aplicado.
- [ ] SR-09 (`NODE_ENV`/secretos *fail-closed*) resuelto.
- [ ] SR-07/SR-10/SR-12 (rate limit, `no-store`, poda de sesiones).
- [ ] CSP con nonce, HSTS, `frame-ancestors`, `poweredByHeader: false`.
- [ ] `pnpm audit --audit-level=high` en verde.
- [ ] `docs/architecture/progress.md` actualizado con los hallazgos cerrados.

---

## 12. Matriz de cumplimiento R1–R18

| Req | Control | Estado |
| --- | --- | --- |
| R1 | CORS con whitelist estricta | ✅ Cumple (sin `*`, `null` rechazado, `Vary: Origin`, tests) |
| R2 | Errores sin fuga de detalle | ✅ Cumple (500 genérico en producción) — ⚠️ depende de `NODE_ENV` (SR-09) |
| R3 | Límite de cuerpo | ✅ 413 con cabeceras — ⚠️ sin límite de profundidad JSON |
| R4 | Cabeceras de seguridad | ✅ API / ❌ **web sin cabeceras** (SR-04) |
| R5 | Secretos en entorno | ✅ Sin secretos versionados; ⚠️ default inseguro (SR-09), `DATABASE_URL` de ejemplo (SR-14) |
| R6 | 404 JSON sin fuga | ✅ Cumple |
| R7 | Rate limit de autenticación | ⚠️ Existe pero insuficiente (SR-07) |
| R8 | Validación Zod en servidor | ✅ Cumple — ⚠️ excepto `avatarUrl` en la Server Action (SR-05) |
| R9 | Logging seguro | ⚠️ Redacción de `cookie`/`authorization` correcta; `username` en logs (B-03) |
| R10 | Cookies de sesión | ✅ `HttpOnly` + `SameSite=Lax` + `Secure` en producción — ⚠️ depende de `NODE_ENV` |
| R11 | Enforcement server-side | ✅ API / ❌ **web** (SR-02); sin middleware de rutas |
| R12 | Registro seguro | ⚠️ Rol no inyectable ✅, señuelo anti-timing ✅; enumeración de email (SR-08) |
| R13 | Login y sesión | ✅ 401 idéntico, Scrypt, sesión nueva por login, logout revoca, CSRF |
| R14 | Rol fresco por petición | ✅ Cumple |
| R15 | Posts | ➖ Obsoleto tras el pivot (SR-13) |
| R16 | Admin + rol inmutable | ❌ **No cumple** (SR-01) |
| R17 | OpenAPI bloqueado en producción | ✅ Cumple — ⚠️ ver SR-09 |
| R18 | Perfiles / anti-enumeración | ⚠️ Email redactado ✅, 404 genérico ✅; el servicio expone `role`/`createdAt` (aceptable) |

---

## 13. Nota de entorno (fuera del alcance del repositorio)

La integración MCP de Supabase disponible en la sesión apunta al proyecto `omrsscgnbbwghxhpdbwi.supabase.co`, cuyas tablas (`profiles`, `resources`, `demands`, `contracts`, `alliance_proposals`…) corresponden a **otra aplicación**, no a este repositorio. No se auditó esa base como parte de Red FaCyT. Conviene verificar el alcance de esas credenciales MCP para evitar operaciones accidentales sobre un proyecto ajeno.

Este repositorio **no contiene PostgreSQL ni Supabase** (Fase 5 pendiente), por lo que no existen RLS, roles ni migraciones que auditar todavía.

---

## 14. Conclusión

La API tiene controles P0 bien implementados y una suite de pruebas sólida, pero **no es apta para integración** por SR-01 (invariante de seguridad ausente, codificado en contra de la especificación) y SR-03 (CVEs críticos sin parchear). El frontend es hoy una maqueta sin control de acceso real: aceptable como fase estática, **bloqueante** para cualquier dato real.

Ninguno de los dos hallazgos críticos exige rediseño: SR-01 son ~15 líneas más un test corregido; SR-03 es un bump de versiones. Ambos son, además, los que más reducen el riesgo por hora invertida.

Según `crown-jewels.md` §5, los hallazgos 🔴 **bloquean la integración**; la corrección corresponde a `blue-team`/`developer` en fase de implementación, con actualización obligatoria de `docs/architecture/progress.md` y evidencia en `docs/tests/`.

**Este informe no modifica código.** Es el entregable de la fase de revisión.
