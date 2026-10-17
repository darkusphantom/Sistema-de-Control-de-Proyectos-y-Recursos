# Arquitectura de Frontend — Red FaCyT (Sistema de Control de Proyectos)

Guía de implementación del frontend. Define la **estructura objetivo** del frontend tras el pivot a Control de Proyectos y Recursos ([`docs/pivot-project.md`](../pivot-project.md)), de modo que sirva de hoja de ruta para migrar a backend sin rework.

> **Este documento es INMUTABLE una vez implementado:** describe la arquitectura objetivo y las convenciones. El estado real de implementación vive en [`progress.md`](progress.md) (dinámico) y se actualiza tras cada cambio. No edites este archivo como parte de una tarea de desarrollo; solo con aprobación explícita de un refactor de arquitectura.
>
> **Historial**: la versión pre-pivot (dominio posts/feed) está descrita en el historial de git; los requisitos del alcance anterior viven en [`docs/archive/implementation_base_v1.md`](../archive/implementation_base_v1.md).

Fuentes de referencia:

- [`docs/implementation/implementation_base.md`](../implementation/implementation_base.md) — requisitos del MVP (control de proyectos).
- [`docs/pivot-project.md`](../pivot-project.md) — diagnóstico del pivot, mapa de rutas y roles.
- [`docs/design/`](../design/) — brief, componentes y wireframes (**rediseño estilo Apple pendiente en Fase 2**; los wireframes del dominio posts quedan obsoletos y se reemplazarán).

## 1. Stack y decisiones

| Decisión | Elección | Nota |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | Server Components por defecto |
| Lenguaje | TypeScript 5 | Código en inglés, UI en español |
| Estilos | Tailwind CSS 4 + CSS variables | Tokens semánticos, sin `hex` suelto |
| Componentes UI | primitivos propios (`ui/`) | shadcn/ui descartado; accesibilidad a cargo del equipo |
| Temas | store propio `theme.ts` | Clase `.dark`, persistencia en `localStorage` |
| Tests | Vitest 5 + Testing Library | Umbral de cobertura ≥ 80% |
| Calidad | Husky pre-commit | `pnpm -r lint` + `pnpm -r test:coverage` |
| API | Hono 4 (`apps/api`) | Integración por sustituir repositorios estáticos |
| Datos | Estáticos en `src/data/` + `auth-gateway.static.ts` | Con patrón repositorio para migrar sin rework |

## 2. Estructura de directorios

Estructura **colocated**: cada test vive junto al código que verifica; `src/test/` centraliza solo helpers de test y `__tests__/` queda reservado para los smoke tests de rutas.

```
apps/web/src/
├── app/                          → RUTA GROUPS — páginas, layouts y metadata
│   ├── layout.tsx                ✓ Layout raíz (metadata, ThemeProvider, .dark)
│   ├── globals.css               ✓ Tokens claro/oscuro + Tailwind
│   ├── (landing)/                → Público: /
│   │   └── page.tsx              ✓ placeholder (bienvenida del sistema — Fase 2)
│   ├── (auth)/                   → Público
│   │   ├── login/page.tsx        ✓ → LoginForm
│   │   └── register/page.tsx     ✓ → RegisterForm
│   └── (main)/                   → Autenticado
│       ├── layout.tsx            ✓ shell (Navbar + BottomNav + Footer)
│       ├── @modal/default.tsx    ✓ slot paralelo (futuros modales)
│       ├── dashboard/page.tsx    ✓ placeholder (KPIs — Fase 2)
│       ├── profile/
│       │   ├── [username]/page.tsx  ✓ perfil de usuario
│       │   └── actions.ts        ✓ server actions de perfil
│       └── admin/page.tsx        ✓ gestión de usuarios/roles (solo admin_sistema)
│
├── components/                   → UI DE DOMINIO
│   ├── ui/                       → primitivos (Badge, SelectField, Dialog, Avatar, …)
│   ├── layout/                   → navbar, bottom-nav, theme-toggle, footer
│   ├── auth/                     → auth-guard + login/register forms (en forms/)
│   ├── profile/                  → user-profile-view, profile-form, password-form, avatar-uploader
│   ├── admin/                    → admin-view, admin-users-section, admin-user-row, confirm-role-dialog
│   └── shared/                   → empty-state (reutilizable sin dominio)
│
├── lib/                          → LÓGICA PURA Y RE-EXPORTACIONES
│   ├── format.ts, cn.ts          ✓ utilidades (colocated tests)
│   ├── types.ts                  → re-exporta User, Session, UserOption, UserRole desde @redfacyt/shared
│   ├── admin/moderation.ts       ✓ canChangeRole (rol admin_sistema inmutable)
│   ├── auth/                     → AuthGateway (interfaz) + StaticAuthGateway
│   ├── session/session-provider.tsx → estados loading/authenticated/anonymous
│   ├── validation/               → validación pura de formularios (profile)
│   └── repositories/             → CONTRATO hexagonal
│       ├── user-repository.ts            → interfaz UserRepository
│       ├── user-repository.static.ts     → impl. estática sobre src/data
│       └── user-repository.contract.test.ts
│
├── data/                         → DATOS ESTÁTICOS mock
│   └── users.ts                  ✓ fixtures con roles admin_sistema/aprobador/coordinador
│
├── test/                         → HELPERS de test (factories, render)
│
└── __tests__/                    → SOLO SMOKE de rutas
    └── routes.smoke.test.tsx     ✓
```

**Convenciones** (sin cambios respecto a la versión pre-pivot):

- **Código en inglés**: nombres de archivos, identificadores y strings internos en `apps/web/src/`.
- **UI en español**: todo texto visible al usuario va en español.
- **JSDoc obligatorio** en toda función/componente público.
- **Server Components por defecto**; `'use client'` solo donde haya interacción.
- **Colocation de tests**: `module.ts` → `module.test.ts` en la misma carpeta.
- **Patrón repositorio**: las vistas consumen interfaces; al llegar el backend solo cambia la implementación.

## 3. Mapa de rutas (transitorio — Fase 1 del pivot)

| Ruta | Grupo | Acceso | Pantalla |
| --- | --- | --- | --- |
| `/` | `(landing)` | público | Placeholder de bienvenida (rediseño Fase 2) |
| `/login` | `(auth)` | público | Iniciar sesión |
| `/register` | `(auth)` | público | Registro (crea `coordinador` por defecto) |
| `/dashboard` | `(main)` | autenticado | Placeholder del dashboard ejecutivo (Fase 2) |
| `/profile/[username]` | `(main)` | autenticado | Perfil de usuario (conservado del alcance anterior) |
| `/admin` | `(main)` | solo `admin_sistema` | Gestión de usuarios y roles |

Guardas:
- `(main)`: sin sesión → `/login` (SessionProvider + layout).
- `/admin`: rol ≠ `admin_sistema` → `/dashboard` (server-side en backend; cliente en fase estática).

El mapa completo objetivo (proyectos, inventario, equipos, solicitudes, prorrateo, reportes, auditoría) está en [`docs/pivot-project.md`](../pivot-project.md) §6 y se implementa en las Fases 2–4.

Recuperación de contraseña: **fuera del MVP**.

## 4. Estado del repositorio

El estado real de implementación **no vive en este archivo**. Consulta [`progress.md`](progress.md).

## 5. Theming (claro/oscuro)

- Tokens como CSS variables en `globals.css`, con valores light en `:root` y dark bajo `.dark`.
- Componentes usan **solo tokens semánticos**; prohibido `hex` suelto.
- `ThemeProvider` propio en el layout raíz + `ThemeToggle` en la navbar; `.dark` aplicado antes del primer pintado.
- **Pendiente Fase 2**: migración de tokens al estilo Apple (azul `#0071E3`, fondos blancos/grises, radios grandes) según `docs/pivot-project.md` §8. La estructura de variables CSS se conserva.

## 6. Capa de datos estática

- `src/data/` expone mocks con la misma forma que el modelo futuro (`users.ts`; el resto de entidades llega con las Fases 3–4).
- `src/lib/repositories/` define interfaces e implementaciones estáticas; la sesión ficticia la resuelve `StaticAuthGateway` (antes `data/session.ts`, eliminado por sin consumidores).
- `GET /users/coordinadores` (API) sustituye al antiguo listado de autores: `UserRepository.listByRole(role)` en la API y el contrato web.

## 7. Testeo

- Tests por pantalla y componente con Vitest + Testing Library (jsdom); colocated.
- Umbral de cobertura **≥ 80%** en todas las métricas (`vitest.config.mts`), exigido por Husky.
- Smoke tests de rutas en `__tests__/routes.smoke.test.tsx`.
