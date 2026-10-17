# Sistema de Control de Proyectos y Recursos — FACYT

Aplicación web para el **control de proyectos científicos y sus recursos** (inventario, equipos, despachos, solicitudes de gasto, prorrateo, reportes y auditoría) de la **Facultad Experimental de Ciencias y Tecnología (FACYT)**.

> **Estado**: pivot en curso (Fase 1 completada: limpieza del dominio anterior, roles y documentación). Fases pendientes en [`docs/pivot-project.md`](docs/pivot-project.md) §9.
>
> Documentos de referencia: enunciado del pivot [`docs/PIVOT-enunciado-control-de-proyectos-quimicos.md`](docs/PIVOT-enunciado-control-de-proyectos-quimicos.md) · plan [`docs/pivot-project.md`](docs/pivot-project.md) · alcance [`docs/implementation/implementation_base.md`](docs/implementation/implementation_base.md). La spec del proyecto anterior (Red FaCyT) está archivada en [`docs/archive/`](docs/archive/).

## Tecnologías

| Tecnología | Propósito |
| --- | --- |
| [Next.js 16](https://nextjs.org/) (App Router) | Framework React con renderizado server-side |
| [React 19](https://react.dev/) | Librería de interfaz de usuario |
| [TypeScript 5](https://www.typescriptlang.org/) | Tipado estático |
| [Tailwind CSS 4](https://tailwindcss.com/) | Estilos utilitarios |
| [Vitest 5](https://vitest.dev/) | Tests unitarios y de componentes con cobertura (v8) |
| [ESLint 9](https://eslint.org/) | Análisis estático de código |
| [Husky 9](https://typicode.github.io/husky/) | Hooks de Git (gate de calidad pre-commit) |
| [PNPM](https://pnpm.io/) | Gestor de paquetes |
| [PostgreSQL](https://www.postgresql.org/) | Base de datos local (fase de backend) |
| [Hono](https://hono.dev/) | Framework de la API en `apps/api` (`@red-facyt/api`) |
| [Vercel](https://vercel.com/) | Despliegue |

## Requisitos

- **Node.js ≥ 20** (desarrollado con Node 24)
- **PNPM ≥ 9**
- **PostgreSQL local** — solo necesario en la fase de backend; el frontend actual usa datos estáticos.

## Instalación y uso

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear variables de entorno a partir de la plantilla
cp .env.example .env.local

# 3. Levantar el servidor de desarrollo
pnpm dev
# Abre http://localhost:3000

# 4. Ejecutar los tests
pnpm test

# 5. Ejecutar los tests con cobertura (umbral >= 80%)
pnpm test:coverage

# 6. Ejecutar el linter
pnpm lint

# 7. Compilar el build de producción
pnpm build
```

## Scripts

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo (Turbopack) |
| `pnpm build` | Build de producción |
| `pnpm start` | Servidor de producción |
| `pnpm lint` | ESLint (configuración flat) |
| `pnpm test` | Vitest (una ejecución) |
| `pnpm test:coverage` | Vitest con cobertura v8 y umbral ≥ 80% |

## Variables de entorno

Copia `.env.example` a `.env.local` y ajusta los valores. Nunca se suben secretos reales al repositorio.

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | URL base de la aplicación | `http://localhost:3000` |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL local (fase de backend) | `postgresql://postgres:postgres@localhost:5432/red_facyt` |

## Estructura del proyecto

Monorepo **pnpm** con múltiples workspaces:

```
apps/
├── api/                     # API backend (@red-facyt/api) — Hono 4
│   ├── src/app.ts           #   createApp() puro y testeable
│   ├── src/server.ts        #   bootstrap HTTP (@hono/node-server)
│   ├── src/config/env.ts    #   entorno con zod (fail-fast)
│   ├── src/middleware/      #   seguridad: CORS, headers, body-limit, error-handler…
│   └── src/domain/          #   puertos hexagonales (contrato del frontend)
└── web/                     # Web frontend (@red-facyt/web) — Next.js 16
    ├── src/app/             #   Rutas de la aplicación (App Router)
    ├── src/lib/             #   Utilidades frontend
    └── src/__tests__/       #   Tests de rutas
packages/
├── shared/                  # Código común (@redfacyt/shared)
│   ├── src/types/           #   Tipos TypeScript compartidos (user, session, pagination)
│   └── src/schemas/         #   Esquemas Zod compartidos (auth, user, profile)
└── tsconfig/                # Configuración base de TypeScript
```

## API (`apps/api`)

La API vive en `apps/api` (workspace `@red-facyt/api`), implementada con **Hono 4** y `@hono/node-server`. Incluye:

- **Scaffold**: patrón `createApp` (puro y testeable), entorno validado con zod (fail-fast), middleware de seguridad (CORS whitelist, security headers, body limit, error handler sin fuga de stack, 404 JSON, `x-request-id`) y `GET /api/v1/health`.
- **Auth (Better Auth en memoria)**: registro, login (por `username`), sesión y logout bajo `/api/v1/auth/*`. Sesiones de BD en memoria (revocables), cookies `httpOnly`/`SameSite=Lax`/`Secure`(prod), hashing **Scrypt**, CSRF de doble envío (`facy.csrf_token`) y rate limiting por IP/usuario (`429`).
- **Endpoints `/api/v1/*`**: usuarios (`/users/coordinadores`, `/users/:username` con email redactado) y admin (`/admin/users/:id/role`, solo `admin_sistema`). Validación **zod** por ruta y rol **fresco por petición**. Los endpoints del nuevo dominio (proyectos, inventario, equipos, solicitudes, prorrateo, reportes, auditoría) llegarán con la Fase 3 del pivot.
- **OpenAPI**: `GET /api/v1/openapi.json` y `/docs` (bloqueados en producción).

En memoria (MVP): los datos viven en `src/infrastructure/repositories/in-memory/` con contrato hexagonal (`src/domain/`) migrable a PostgreSQL sin rework.

```bash
# Instalar dependencias de la API (desde la raíz)
pnpm install

# Ejecutar la API en desarrollo (puerto 3001)
pnpm --filter @red-facyt/api dev

# Verificar la salud
curl http://localhost:3001/api/v1/health

# Documentación OpenAPI (dev)
curl http://localhost:3001/api/v1/openapi.json

# Tests y calidad de la API
cd apps/api
pnpm test:coverage   # umbral ≥ 80%
pnpm typecheck
pnpm lint
```

> **Windows/pnpm**: en este entorno `pnpm run` dispara un chequeo de `install` que puede crashear; usa los binarios locales (`npx tsc`, `npx eslint`, `npx vitest run --coverage`) dentro de `apps/api` si ocurre.

Documentación de la API: [`docs/architecture/api-structure.md`](docs/architecture/api-structure.md) y [`docs/security/threat-model-api.md`](docs/security/threat-model-api.md).

## Despliegue en Vercel

1. **Sube el repositorio a GitHub** (rama `develop` como rama de trabajo; `main` para producción).
2. **Importa el proyecto en Vercel**: [vercel.com/new](https://vercel.com/new) → *Import Git Repository* → selecciona el repositorio.
3. **Configura el framework**: Vercel detecta Next.js automáticamente (build: `pnpm build`, output: `standalone` no requerido).
4. **Variables de entorno**: añade en el panel *Settings → Environment Variables* las variables de `.env.example` con los valores de producción.
5. **Despliega**: Vercel ejecuta `pnpm install` y `pnpm build` automáticamente en cada push a la rama de producción.
6. **Verifica**: abre la URL asignada (`https://<proyecto>.vercel.app`) y revisa los logs de build si algo falla.

> Nota: el proyecto usa `pnpm`; Vercel lo detecta por el `packageManager` declarado en `package.json` y el `pnpm-lock.yaml`.

## Calidad

- **Gate pre-commit (Husky)**: cada commit ejecuta `pnpm lint` y `pnpm test:coverage` (umbral ≥ 80%). Detalles en [`docs/husky.md`](docs/husky.md).
- **TDD**: los tests se escriben antes que la implementación.
- **JSDoc**: toda función pública está documentada con JSDoc.

## Documentación

- [`docs/PIVOT-enunciado-control-de-proyectos-quimicos.md`](docs/PIVOT-enunciado-control-de-proyectos-quimicos.md) — enunciado del proyecto (tras el pivot)
- [`docs/pivot-project.md`](docs/pivot-project.md) — plan de pivot: diagnóstico, mapa de rutas, roles y fases
- [`docs/design/wireframes.md`](docs/design/wireframes.md) — mapa de navegación (wireframes del nuevo dominio pendientes, Fase 2)
- [`docs/implementation/implementation_base.md`](docs/implementation/implementation_base.md) — alcance del MVP (control de proyectos)
- [`docs/architecture/api-structure.md`](docs/architecture/api-structure.md) — arquitectura de la API (`apps/api`)
- [`docs/security/threat-model-api.md`](docs/security/threat-model-api.md) — modelo de amenaza de la API
- [`docs/tests/api-scaffold-test-report.md`](docs/tests/api-scaffold-test-report.md) — evidencia de pruebas del scaffold de la API
- [`docs/tests/api-auth-endpoints-test-report.md`](docs/tests/api-auth-endpoints-test-report.md) — evidencia de pruebas de auth + endpoints + OpenAPI
- [`docs/husky.md`](docs/husky.md) — gate de calidad pre-commit