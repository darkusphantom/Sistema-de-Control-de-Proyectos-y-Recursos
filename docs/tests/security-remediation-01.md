# Evidencia — Remediación de seguridad 01 (informe01)

**Fecha:** 2026-10-29
**Autor:** `developer` (implementación TDD)
**Origen:** [`docs/security/informe01.md`](../security/informe01.md)
**Alcance:** correcciones de código autorizadas por el usuario. Las partidas diferidas (SR-02, SR-06, SR-07, SR-12, SR-08, SR-13) quedan para la Fase 5 o para `security-architect`.

## 1. Decisiones aplicadas

| Decisión | Elección | Motivo |
| --- | --- | --- |
| ¿La API puede crear administradores? | **No** | D5/D6: el alta/baja de administradores es operativa (seed). Evita la carrera por el “último admin”. |
| Tope de avatar | **1 MB real** (límite de Server Actions) | No se eleva el límite de body para no multiplicar la memoria por petición. |
| CSP | **`Report-Only`** | El enforcing con nonce fuerza render dinámico en todas las páginas; se difiere a la integración. |
| Versión de Next | **16.4.3** | Última parcheada; `16.4.1` es el mínimo del advisory. |

## 2. Cambios por PR

### PR-1 — Inmutabilidad de `admin_sistema` + auditoría (SR-01, SR-11)

- `packages/shared/src/schemas/auth.ts`: `SetUserRoleSchema` acepta solo `coordinador|aprobador`.
- `apps/api/src/application/admin/set-user-role.ts`: lee el objetivo, rechaza `admin_sistema` con `ConflictError("immutable_role", 409)` y emite `role_change` sin PII. Una sola lectura sirve al guard y a la auditoría → **O(1)**.
- `apps/api/src/routes/admin.routes.ts`: pasa `actorId` (sesión) y `requestId` (contexto).
- `apps/web/src/components/admin/admin-user-row.tsx`: elimina la opción `admin_sistema` del selector.
- Tests: democión propia y ajena → 409; promoción a admin → 400; auditoría con actor/transición/`requestId` y sin email, username ni contraseña.

### PR-2 — Dependencias (SR-03)

- `next` y `eslint-config-next` → `16.4.3`; `zod` → `^4.6.7` en API y shared.
- `pnpm-workspace.yaml`: `overrides.undici@<8.12.2 → 8.12.2` (transitivo de jsdom, solo test).
- `pnpm audit --prod`: **1 aviso low** (esbuild, dev server en Windows). Antes: 20 (2 críticos, 7 altos).

### PR-3 — Configuración segura por defecto (SR-09, SR-10, B-01, B-03, B-06)

- `config/env.ts`: `DEV_AUTH_SECRET` exportado y **rechazado** con `NODE_ENV=production`; `OPENAPI_ENABLED` default `false`.
- `middleware/cors.ts`: cada origen se valida con `URL` al arrancar, se normaliza y se deduplica; la comprobación por request usa `Set` (**O(1)**).
- `middleware/no-store.ts` (nuevo): `Cache-Control: no-store` global.
- `middleware/csrf.ts`: `crypto.timingSafeEqual` con guarda de longitud.
- `application/auth/sign-in.ts`: log `{ event, reason, err }` sin username ni email.

### PR-4 — Contrato del frontend (SR-05, SR-16, M-1)

- `lib/validation/profile.ts`: `avatarUrl` validado con `avatarDataUrlSchema`; rechaza URLs externas y data URLs no PNG/JPEG; mensaje de tamaño propio. Longitud O(1) antes del prefijo.
- `lib/auth/index.ts` y `lib/repositories/index.ts` (nuevos): composition root con singletons de módulo.
- 7 consumidores migrados; los 9 puntos de instanciación directa quedan en 2.
- `auth-gateway.static.ts`: `assertNotProduction()` en `signIn`/`signUp`/`changePassword`; `getSession()` devuelve `null` en producción (**fail-closed** sin romper el build).

### PR-5 — Cabeceras del frontend (SR-04 parcial, B-08)

- `next.config.ts`: `poweredByHeader: false`, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS solo en producción y CSP `Report-Only`.
- Verificado con `next start` + `curl`: las cabeceras salen en la respuesta y no hay `X-Powered-By`.

### PR-6 — Tooling (SR-14, SR-15)

- `.github/workflows/ci.yml`: lint → cobertura → build → audit de producción (high+) → gitleaks → gate de adaptadores estáticos.
- `apps/web/.env.example`: `DATABASE_URL` vacío con el formato en comentario.
- `pnpm-workspace.yaml`: se conserva `allowBuilds` (campo correcto de pnpm 11) y se documenta.

## 3. Verificación ejecutada

| Comando | Resultado |
| --- | --- |
| `pnpm -r lint` | Limpio (3 workspaces, `--max-warnings 0`) |
| `pnpm -r test` | **620/620** (shared 37, API 140, web 443) |
| `pnpm -r test:coverage` | shared 100% · API 94.91% stmts / 81.59% branches · web 95.53% stmts / 88.25% branches → **gate ≥ 80% PASS** |
| `pnpm -r build` | API (tsup) + Next.js 16.4.3 OK; 8 rutas generadas |
| `pnpm audit --prod` | 1 low (esbuild, dev/Windows) |
| `next start` + `curl -I /login` | Cabeceras presentes; HSTS activo (build de producción) |
| Gate de adaptadores (`grep`) | Sin infractores fuera del composition root |

## 4. Riesgos residuales y siguiente paso

- **SR-02**: la sesión sigue en `localStorage`. El guard de producción evita autenticar con la maqueta, pero mientras no exista la API el frontend no es desplegable funcionalmente. Es el bloqueante de la Fase 5.
- **SR-04**: CSP en `Report-Only`. Al integrar, mover a enforcing con nonce en middleware y medir el impacto en renderizado.
- **SR-06**: `changePassword` sigue simulado; en producción lanza por el guard.
- **SR-07/SR-12**: rate limiting y poda de sesiones requieren persistencia.
- **SR-13**: revisión de `security-architect` sobre el modelo de amenaza del dominio de proyectos.
- `frontend-structure.md` no se modificó (inmutable).
