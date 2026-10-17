# Pivot: Red FaCyT → Sistema de Control de Proyectos y Recursos

> **Documento generado:** 2026-10-17  
> **Autor:** Agente de Diseño (rol `/design-agent`)  
> **Propósito:** Diagnóstico del estado actual del proyecto y plan de migración hacia el nuevo enunciado académico *"Sistema de Control de Proyectos y Recursos"* (Escuela de Computación, UC).

---

## 1. Contexto del Pivot

El equipo tenía en marcha **Red FaCyT**, una red institucional de publicaciones académicas.  
El nuevo enunciado exige construir un **Sistema de Control de Proyectos y Recursos** para una organización académica/empresarial que gestiona proyectos de física, química y biología, con control de inventario, prorrateo de consumibles compartidos (overhead), flujo de aprobaciones y dashboard ejecutivo.

**El pivot no parte de cero.** La arquitectura, el tooling, los patrones de seguridad y la estructura de código son reutilizables en su gran mayoría. Lo que cambia es el **dominio de negocio**, el **modelo de datos** y las **vistas/módulos funcionales**.

---

## 2. Estado Actual del Proyecto

### 2.1 Resumen ejecutivo de lo construido

| Capa | Estado | Tests |
|------|--------|-------|
| Scaffold monorepo pnpm (Next.js 16 + Hono 4) | ✅ Completo | — |
| Gate de calidad Husky (lint + cobertura ≥ 80%) | ✅ Completo | — |
| Paquete `@redfacyt/shared` (tipos, schemas Zod) | ✅ Completo | — |
| Frontend estático (`apps/web`) — todas las vistas | ✅ Completo | 275/275 |
| API en memoria (`apps/api`) — auth + CRUD + OpenAPI | ✅ Completo | 179/179 |
| Arquitectura hexagonal + patrón repositorio | ✅ Completo | — |
| Seguridad: CORS, CSRF, rate-limit, headers | ✅ Completo | — |
| Better Auth v1.7.7 (sesiones en memoria) | ✅ Completo | — |
| PostgreSQL / persistencia real | ❌ Pendiente | — |
| Integración frontend ↔ API (repos reales) | ❌ Pendiente | — |
| **Total tests (monorepo)** | **454/454** | **100% PASS** |

### 2.2 Arquitectura técnica actual

```
acedemic-publish-system/
├── apps/
│   ├── web/          → Next.js 16, App Router, Tailwind 4, Vitest
│   └── api/          → Hono 4, Better Auth, Zod, arquitectura hexagonal
├── packages/
│   ├── shared/       → Tipos, schemas Zod, taxonomía (fuente de verdad)
│   └── tsconfig/     → Base TypeScript compartida
└── docs/
    ├── architecture/ → frontend-structure.md, api-structure.md, progress.md
    ├── design/       → wireframes, brief, auth, components
    ├── security/     → threat-model-api.md, crown-jewels.md
    └── implementation/
```

### 2.3 Rutas actuales del frontend

| Ruta | Descripción actual |
|------|--------------------|
| `/` | Bienvenida con slider interactivo |
| `/login` `/register` | Autenticación |
| `/feed` | Feed de publicaciones con filtros |
| `/posts/new` `/posts/[id]` | CRUD de publicaciones |
| `/profile/[username]` | Perfil de usuario |
| `/admin` | Gestión de roles y moderación |

### 2.4 Módulos/dominio de la API actual

- **Auth:** register, login, session, logout (Better Auth + Scrypt)
- **Posts:** CRUD con visibilidad por rol (publicado/borrador/oculto)
- **Users:** listado de autores, perfil por username
- **Admin:** asignación de roles, moderación de visibilidad

### 2.5 Roles actuales

`estudiante` · `profesor` · `admin`

---

## 3. Análisis Comparativo: Red FaCyT vs. Nuevo Enunciado

| Aspecto | Red FaCyT (actual) | Nuevo enunciado |
|---|---|---|
| **Dominio** | Red social de publicaciones universitarias | Control de proyectos científicos y recursos |
| **Entidad central** | `Post` (publicación) | `Proyecto` (código, estatus, prioridad, métricas) |
| **Roles** | estudiante / profesor / admin | Admin del Sistema / Coordinador / Aprobador |
| **Inventario** | No existe | Materia prima + consumibles + equipos |
| **Flujo de aprobación** | No existe | Borrador → Pendiente → Aprobado/Rechazado → Ejecutado |
| **Prorrateo** | No existe | Cálculo proporcional/equitativo de consumibles compartidos |
| **Reserva de equipos** | No existe | Módulo de reserva con control de conflictos |
| **Dashboard** | Feed de publicaciones | KPIs ejecutivos: avance físico, presupuesto, alertas stock |
| **Exportación** | No existe | PDF y Excel (reportes gastos, prorrateo, hoja de vida equipos) |
| **Audit log** | Parcial (logs de API) | Registro inmutable con timestamp, user_id, ip_address |
| **Diseño UI** | Gaceta digital, ámbar/obsidiana | Estilo Apple: blanco, bordes redondeados, modo claro/oscuro |
| **Stack técnico** | Next.js + Hono + Better Auth | **Libre** — el equipo conserva el stack actual (compatible) |

---

## 4. Diagnóstico: ¿Qué se Reutiliza?

### ✅ CONSERVAR sin cambios

| Elemento | Motivo |
|----------|--------|
| Monorepo pnpm (`apps/`, `packages/`) | Estructura perfectamente válida |
| `apps/api` — scaffold Hono 4, middleware de seguridad | CORS, rate-limit, CSRF, headers son agnósticos al dominio |
| Better Auth (sesiones, hashing Scrypt) | El mecanismo de auth es independiente del dominio |
| Arquitectura hexagonal (puertos/adaptadores/repositorios) | Patrón aplicable a cualquier dominio |
| `packages/tsconfig` | Base de compilación reutilizable |
| `apps/web` — scaffold Next.js, tooling, Husky, Vitest | El andamiaje es agnóstico al dominio |
| `apps/web` — rutas de auth (`/login`, `/register`) | Solo cambia el registro de campos |
| `apps/web` — sistema de tokens de diseño (CSS variables) | Se adapta con mínimos cambios a estilo Apple |
| `apps/web` — componentes UI primitivos (`Button`, `Badge`, `Field`) | Agnósticos al dominio |
| `apps/web` — `SessionProvider`, `AuthGuard`, `ThemeToggle` | Reutilizables directamente |
| Gate de calidad Husky | No cambia |
| Documentación de seguridad (`threat-model-api.md`) | Se extiende, no se reemplaza |

**Estimación de reutilización de código:** ~55-65% del código base es directamente reutilizable o requiere solo renombrado.

---

## 5. Lista Completa de Cambios del Pivot

### 5.1 🗑️ ELIMINAR (código y docs a descartar)

Estos elementos son específicos del dominio de Red FaCyT y no tienen equivalente en el nuevo sistema:

#### `packages/shared/src/`
- `taxonomy/` — categorías y tipos de publicaciones académicas (PostCategory, PostType)
- `domain/post.ts` — modelo Post (publicación de red social)
- `schemas/post.ts` — schemas Zod de publicación

#### `apps/api/src/`
- `domain/post.ts` — dominio de publicaciones
- `domain/visibility.ts` — lógica de visibilidad de posts
- `routes/posts.routes.ts` + `posts.routes.test.ts`
- `application/posts/` — use cases de publicaciones (create, update, delete, find)
- `infrastructure/repositories/in-memory/post-repository.ts`
- `routes/openapi.ts` — spec OpenAPI actual (debe rehacerse para el nuevo dominio)

#### `apps/web/src/`
- `app/(main)/feed/` — página del feed de publicaciones
- `app/(main)/posts/` — rutas de publicaciones (new, [id], edit, delete)
- `app/(main)/@modal/` — rutas paralelas modales de publicaciones
- `app/(landing)/` — página de bienvenida estilo gaceta/slider
- `components/feed/` — `PostCard`, `FilterBar`, `FeedView`, `LoadMore`
- `components/forms/post-form.tsx`, `delete-post-modal.tsx`
- `components/landing/` — `LandingSlider`, `SlideCard`, `SlideIndicators`
- `data/posts.ts` — mock de publicaciones académicas
- `lib/visibility.ts` — re-exportación de visibilidad de posts
- `lib/filters.ts` — filtros de posts
- `lib/taxonomy.ts` — taxonomía de posts
- `lib/keywords.ts` — extracción de hashtags

#### `docs/design/`
- `wireframes_feed.md` — wireframes del feed de publicaciones
- `wireframes_posts.md` — wireframes de crear/editar publicaciones
- `wireframes_post_detail.md` — wireframes del detalle de publicación
- `wireframes_welcome.md` — la bienvenida del slider de Red FaCyT

> **Nota:** `docs/Proyecto1_Junio2026.md` quedó ARCHIVADO en `docs/archive/Proyecto1_Junio2026.md`, no se eliminó.

---

### 5.2 ✏️ MODIFICAR (adaptar al nuevo dominio)

#### `packages/shared/src/`

| Archivo | Cambio |
|---------|--------|
| `types/user.ts` | Cambiar roles: `estudiante/profesor/admin` → `admin_sistema / coordinador / aprobador` |
| `types/index.ts` | Agregar tipos: `Project`, `Resource`, `Equipment`, `PurchaseLot`, `DispatchLog`, `SpendingRequest`, `OverheadAllocation`, `AuditLog`, `Reservation` |
| `schemas/auth.ts` | Actualizar campos de registro (solo crea `coordinador` por defecto) |
| `index.ts` | Re-exportar nuevas entidades |

#### `apps/api/src/`

| Archivo | Cambio |
|---------|--------|
| `domain/user.ts` | Actualizar `UserRole`: `admin_sistema / coordinador / aprobador` |
| `routes/auth.routes.ts` | Registro crea `coordinador` por defecto (no `estudiante`) |
| `routes/admin.routes.ts` | Ampliar: gestión de usuarios, catálogos y auditoría global |
| `application/auth/` | Actualizar restricción de campo `role` en registro |
| `infrastructure/repositories/in-memory/user-repository.ts` | Actualizar usuarios mock con nuevos roles |
| `app.ts` | Registrar nuevas rutas del dominio |

#### `apps/web/src/`

| Archivo/Módulo | Cambio |
|----------------|--------|
| `app/(auth)/register/page.tsx` | Adaptar campos al nuevo sistema |
| `app/(main)/layout.tsx` | Cambiar links de navegación |
| `components/layout/navbar.tsx` | Actualizar ítems de navegación y rutas |
| `components/layout/bottom-nav.tsx` | Actualizar destinos de navegación |
| `app/(main)/admin/page.tsx` | Ampliar a gestión de catálogos, usuarios y auditoría |
| `data/users.ts` | Actualizar usuarios mock con nuevos roles |
| `lib/repositories/` | Renombrar/reemplazar `post-repository` por `project-repository` |
| `globals.css` | Adaptar tokens al estilo Apple |

#### `docs/`

| Archivo | Cambio |
|---------|--------|
| `AGENTS.md` | Actualizar nombre del proyecto y entidad central |
| `OBJECTIVE.md` | Actualizar objetivo al nuevo enunciado |
| `architecture/progress.md` | Registrar pivot en historial de cambios |
| `architecture/frontend-structure.md` | Actualizar mapa de rutas y estructura de carpetas |
| `architecture/api-structure.md` | Actualizar contratos de endpoints |
| `design/brief.md` | Nuevo brief estilo Apple |
| `design/components.md` | Actualizar inventario de componentes |
| `design/wireframes.md` | Actualizar mapa de navegación |
| `design/wireframes_profile.md` | Quitar sección "mis publicaciones", adaptar al nuevo rol |
| `design/wireframes_admin.md` | Ampliar a catálogos del sistema |
| `docs/trello/board.json` | Renovar tablero Kanban con nuevas cards |

---

### 5.3 🆕 NUEVO (implementar desde cero)

#### `packages/shared/src/` — Nuevos tipos y schemas

| Módulo | Descripción |
|--------|-------------|
| `types/project.ts` | `Project` (código único, estatus, prioridad, % avance físico, % presupuesto) |
| `types/resource.ts` | `Resource` (materia prima y consumibles, stock, alerta mínimo, lotes) |
| `types/equipment.ts` | `Equipment` (activos, estado: Disponible / En uso / En mantenimiento) |
| `types/lot.ts` | `PurchaseLot` (fecha ingreso, costo unitario, proveedor, tipo: directo/overhead) |
| `types/dispatch.ts` | `DispatchLog` (bitácora inmutable de salidas de almacén) |
| `types/request.ts` | `SpendingRequest` (flujo: Borrador→Pendiente→Aprobado/Rechazado→Ejecutado) |
| `types/overhead.ts` | `OverheadAllocation` (prorrateo, período contable, criterio de reparto) |
| `types/audit.ts` | `AuditLog` (timestamp, user_id, ip_address, acción, entidad, estado ant./nuevo) |
| `types/reservation.ts` | `Reservation` (reserva de equipos, proyecto, rango de tiempo, estado) |
| `schemas/project.ts` | Validación Zod para crear/editar proyectos |
| `schemas/resource.ts` | Validación Zod para recursos |
| `schemas/request.ts` | Validación Zod para solicitudes de gasto |
| `schemas/overhead.ts` | Validación Zod para prorrateo |
| `schemas/reservation.ts` | Validación Zod para reservas de equipos |

#### `apps/api/src/` — Nuevos módulos de la API

| Módulo | Endpoints principales |
|--------|-----------------------|
| `routes/projects.routes.ts` | `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`, `PATCH /projects/:id/priority` |
| `routes/resources.routes.ts` | CRUD de materia prima y consumibles, alertas de stock mínimo |
| `routes/equipment.routes.ts` | CRUD de equipos, estado operacional |
| `routes/lots.routes.ts` | Registro de lotes de compra (directos y overhead) |
| `routes/dispatch.routes.ts` | `POST /dispatch`, `GET /dispatch/history` (bitácora inmutable) |
| `routes/requests.routes.ts` | CRUD de solicitudes de gasto + cambio de estado con flujo |
| `routes/overhead.routes.ts` | `POST /overhead/calculate`, `GET /overhead/history` |
| `routes/reservations.routes.ts` | Reserva de equipos, verificación de conflictos de agendamiento |
| `routes/audit.routes.ts` | `GET /audit/logs` (solo admin, inmutable) |
| `routes/reports.routes.ts` | Generación de reportes PDF/Excel |
| `application/projects/` | Use cases: crear, actualizar, cambiar estatus, cambiar prioridad + justificación |
| `application/resources/` | Use cases: CRUD, ajuste de stock, alerta de mínimo |
| `application/equipment/` | Use cases: CRUD, cambio de estado, reserva con verificación de conflictos |
| `application/requests/` | Use cases: flujo de aprobación con validaciones de rol |
| `application/overhead/` | Use cases: cerrar período, calcular prorrateo proporcional/equitativo |
| `application/reports/` | Use cases: generar PDF/Excel de reportes |
| `domain/project.ts` | Entidad Proyecto, reglas: cambio de prioridad requiere justificación |
| `domain/resource.ts` | Entidad Recurso, lógica de stock y alertas |
| `domain/equipment.ts` | Entidad Equipo, estados operacionales y disponibilidad |
| `domain/request.ts` | Entidad Solicitud, máquina de estados del flujo de aprobación |
| `domain/overhead.ts` | Lógica de prorrateo (algoritmos proporcional y equitativo) |
| `domain/audit.ts` | Entidad log inmutable (INSERT-only) |

#### `apps/web/src/` — Nuevas rutas y vistas

| Ruta | Vista | Rol |
|------|-------|-----|
| `/dashboard` | KPIs: proyectos activos, presupuesto global, alertas de stock | Todos |
| `/projects` | Lista de proyectos con filtros (estatus, prioridad, % avance) | Todos |
| `/projects/new` | Formulario de nuevo proyecto | Admin / Coordinador |
| `/projects/[id]` | Detalle: métricas, recursos, hitos, solicitudes | Todos |
| `/projects/[id]/edit` | Editar proyecto | Admin / Coordinador |
| `/projects/[id]/priority` | Cambiar prioridad + justificación obligatoria | Admin / Aprobador |
| `/inventory` | Catálogo unificado: materia prima + consumibles con stock en tiempo real | Todos |
| `/inventory/new` | Alta de nuevo recurso/consumible | Admin / Aprobador |
| `/inventory/[id]` | Detalle del recurso, historial de lotes, alertas | Todos |
| `/inventory/lots/new` | Registrar lote de compra (directo o overhead) | Aprobador |
| `/equipment` | Catálogo de equipos con estado operacional | Todos |
| `/equipment/new` | Alta de equipo | Admin |
| `/equipment/[id]` | Detalle de equipo, historial de uso, reservas activas | Todos |
| `/equipment/[id]/reserve` | Formulario de reserva con validación de conflictos | Coordinador |
| `/dispatch` | Formulario de despacho de almacén | Coordinador / Aprobador |
| `/dispatch/history` | Bitácora inmutable de despachos | Todos |
| `/requests` | Lista de solicitudes de gasto con filtros de estado | Todos |
| `/requests/new` | Nueva solicitud (Borrador) | Coordinador |
| `/requests/[id]` | Detalle + acción de aprobación/rechazo | Aprobador |
| `/overhead` | Panel de prorrateo: períodos, cálculo, historial | Aprobador / Admin |
| `/reports` | Generación de reportes PDF/Excel | Admin / Aprobador |
| `/audit` | Log de auditoría inmutable (solo Admin del Sistema) | Admin |
| `/admin` | Gestión integral: usuarios, catálogos, parámetros del sistema | Admin |

#### `docs/design/` — Nuevos wireframes

| Documento | Contenido |
|-----------|-----------|
| `wireframes_dashboard.md` | Dashboard ejecutivo con KPIs y alertas críticas |
| `wireframes_projects.md` | Lista de proyectos + formulario + detalle + cambio de prioridad |
| `wireframes_inventory.md` | Catálogo de recursos + lotes + alertas de stock |
| `wireframes_equipment.md` | Catálogo de equipos + reservas + estado operacional |
| `wireframes_requests.md` | Flujo de solicitudes de gasto (Borrador→Ejecutado) |
| `wireframes_overhead.md` | Panel de prorrateo de consumibles compartidos |
| `wireframes_dispatch.md` | Bitácora de despachos |
| `wireframes_reports.md` | Generador de reportes PDF/Excel |
| `wireframes_audit.md` | Log de auditoría |

#### Base de datos — Nuevo esquema PostgreSQL

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios (roles: admin_sistema, coordinador, aprobador) |
| `sessions` | Sesiones Better Auth |
| `projects` | Proyectos con código único, estatus, prioridad, métricas |
| `project_priority_log` | Historial de cambios de prioridad con justificación |
| `resources` | Catálogo de materia prima y consumibles |
| `equipment` | Catálogo de equipos/maquinaria con estado operacional |
| `purchase_lots` | Lotes de compra (directo o overhead) con fecha, costo, proveedor |
| `equipment_reservations` | Reservas de equipos por proyecto con rango de tiempo |
| `dispatch_logs` | Bitácora inmutable de despachos de almacén |
| `spending_requests` | Solicitudes de gasto con máquina de estados |
| `overhead_periods` | Períodos contables de prorrateo |
| `overhead_allocations` | Asignaciones de overhead por proyecto |
| `audit_logs` | Log inmutable de acciones del sistema (INSERT-only) |

---

## 6. Mapa de Rutas del Nuevo Sistema

```
/                    → Landing/Bienvenida del sistema
/login               → Inicio de sesión
/register            → Registro (crea coordinador por defecto)

/dashboard           → Dashboard ejecutivo (KPIs, alertas, resumen)

/projects            → Lista de proyectos
/projects/new
/projects/[id]
/projects/[id]/edit
/projects/[id]/priority

/inventory           → Catálogo de recursos (materia prima + consumibles)
/inventory/new
/inventory/[id]
/inventory/lots/new

/equipment           → Catálogo de equipos
/equipment/new
/equipment/[id]
/equipment/[id]/reserve

/dispatch            → Formulario de despacho
/dispatch/history    → Bitácora inmutable

/requests            → Solicitudes de gasto
/requests/new
/requests/[id]

/overhead            → Prorrateo de consumibles compartidos

/reports             → Generación de reportes PDF/Excel

/audit               → Log de auditoría (solo admin_sistema)

/admin               → Panel del Administrador del Sistema
/profile/[username]  → Perfil de usuario (conservado)
```

---

## 7. Nueva Matriz de Roles

| Rol | Código | Acceso principal |
|-----|--------|-----------------|
| **Administrador del Sistema** | `admin_sistema` | Todo el sistema: usuarios, catálogos, auditoría, parámetros |
| **Coordinador de Proyecto** | `coordinador` | Sus proyectos: avances, uso de recursos, solicitudes de gasto |
| **Aprobador / Gestor de Inventario** | `aprobador` | Aprobar/rechazar solicitudes, almacén, prioridades |

> **Nota del enunciado:** Los beneficiarios y personal general de laboratorios **no tienen usuario** en el sistema.

---

## 8. Diseño UI: Migración de Estética (Red FaCyT → Estilo Apple)

| Aspecto | Red FaCyT (actual) | Nuevo sistema |
|---------|-------------------|--------------|
| Fondo base | Obsidiana `#0B0F19` | Blanco `#FFFFFF` / gris suave `#F5F5F7` |
| Acento | Ámbar `#D97706` | Azul Apple `#0071E3` |
| Tipografía | Georgia serif + Inter | `-apple-system, BlinkMacSystemFont, Inter` |
| Bordes | Radios pequeños | Radios grandes (`16px+`), sombras suaves |
| Modo oscuro | Charcoal/obsidiana | Modo oscuro limpio igualmente espacioso |
| Densidad UI | Media | Alta espaciado — mucho espacio en blanco |
| Lenguaje visual | Gaceta universitaria | Panel de gestión empresarial limpio |

**Los tokens CSS (`globals.css`) se actualizan; la estructura de variables CSS se conserva.**

---

## 9. Plan de Ejecución del Pivot

> Las fases siguen el pipeline obligatorio: **Diseño → Implementación → Review → Testing → Documentación**

### Fase 1 — Limpieza y preparación (1-2 días)
- Crear rama `feature/pivot-domain` desde `develop`
- Archivar docs de Red FaCyT en `docs/archive/`
- Eliminar módulos de dominio de Red FaCyT (posts, feed, taxonomy)
- Actualizar roles en `packages/shared` y `apps/api`
- Actualizar `AGENTS.md`, `OBJECTIVE.md`

### Fase 2 — Diseño del nuevo sistema (2-3 días)
- Nuevo brief estilo Apple (`docs/design/brief.md`)
- Wireframes: dashboard, proyectos, inventario, equipos, solicitudes, prorrateo, bitácora, reportes, auditoría
- Review de `security-architect` sobre nuevo modelo de amenaza

### Fase 3 — Dominio compartido y API (3-4 días)
- Nuevos tipos y schemas en `packages/shared`
- Nuevas entidades de dominio en `apps/api`
- Use cases: proyectos, recursos, equipos, solicitudes, overhead, audit
- Nuevas rutas con validación Zod
- Algoritmo de prorrateo (proporcional + equitativo) en dominio puro
- Máquina de estados del flujo de aprobación
- TDD para cada módulo (cobertura ≥ 80%)

### Fase 4 — Frontend (3-4 días)
- Actualizar tokens de diseño (`globals.css`) — estilo Apple
- Dashboard ejecutivo con KPIs
- Módulos: Proyectos, Inventario, Equipos, Solicitudes, Prorrateo, Bitácora, Auditoría, Reportes
- Actualizar `/admin` a catálogos del sistema

### Fase 5 — Backend PostgreSQL e integración (2-3 días)
- Scripts SQL de estructura (DDL) y seeders con datos ficticios
- Adaptadores PostgreSQL (reemplazar repos in-memory)
- Integración frontend ↔ API real
- Reverse proxy con `X-Forwarded-For` correcto

### Fase 6 — Documentación, testing y despliegue
- README actualizado (guía de instalación completa)
- Archivo de prompts utilizados (requisito indispensable del enunciado)
- Evidencia de pruebas en `docs/tests/`
- Configuración de despliegue (servidor local o nube)

---

## 10. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Subestimar la complejidad del prorrateo | Media | Alto | Implementar algoritmo en dominio puro con TDD exhaustivo antes de integrar |
| Flujo de aprobación mal modelado | Media | Alto | Usar máquina de estados explícita (enum + transiciones válidas) validada en dominio |
| Generación de PDF/Excel compleja | Alta | Medio | Usar `pdfmake` + `exceljs`; implementar en fase 5, puede ser bonus si hay tiempo |
| Pérdida de trabajo útil en el pivot | Baja | Medio | Archivar en `docs/archive/` y ramas git, no eliminar del historial |
| Reservas de equipos con condición de carrera | Media | Medio | Validar conflictos a nivel de BD (constraint + transacción) |
| Audit log mutable por error | Baja | Alto | Implementar como INSERT-only a nivel de BD; prohibir UPDATE/DELETE en la tabla |

---

## 11. Checklist de Requisitos del Enunciado

| Requisito | Estado |
|-----------|--------|
| Código único alfanumérico por proyecto | 🆕 Nuevo |
| Estatus operativo (Propuesta/En ejecución/Suspendido/Finalizado) | 🆕 Nuevo |
| Nivel de prioridad (Crítica/Alta/Media/Baja) | 🆕 Nuevo |
| Métricas: % avance físico + % ejecución presupuestaria | 🆕 Nuevo |
| Catálogo unificado de materia prima y consumibles | 🆕 Nuevo |
| Alertas de stock mínimo configurable | 🆕 Nuevo |
| Registro de lotes de compra (fecha, costo, proveedor) | 🆕 Nuevo |
| Catálogo de equipos con estado operacional | 🆕 Nuevo |
| Módulo de reserva previa de equipos | 🆕 Nuevo |
| Bitácora inmutable de despachos | 🆕 Nuevo |
| Prorrateo automático al cierre de período | 🆕 Nuevo |
| Criterios: proporcional al consumo + equitativo | 🆕 Nuevo |
| Flujo de solicitudes: Borrador→Pendiente→Aprobado/Rechazado→Ejecutado | 🆕 Nuevo |
| Cambio de prioridad requiere justificación en bitácora | 🆕 Nuevo |
| Dashboard ejecutivo con KPIs | 🆕 Nuevo |
| Exportación PDF y Excel | 🆕 Nuevo |
| Audit log inmutable (timestamp, user_id, ip_address) | ✏️ Existe parcial — ampliar |
| Arquitectura cliente-servidor | ✅ Ya implementada |
| Diseño UI moderno responsive, estilo Apple, modo claro/oscuro | ✏️ Adaptar tokens |
| Base de datos relacional (PostgreSQL) | ✏️ Pendiente (stack elegido) |
| Script SQL de estructura + seeders con datos ficticios | 🆕 Nuevo |
| README con guía de instalación | ✅ Existe — actualizar |
| Repositorio estructurado | ✅ Existe |
| Autenticación y control de acceso por rol (server-side) | ✅ Ya implementado |
| Contraseñas con hash | ✅ Ya implementado (Scrypt) |
| Validación frontend y backend | ✅ Ya implementado (Zod) |
| Archivo de prompts utilizados (requisito indispensable) | 🆕 Nuevo — crear `prompts.md` |

---

## 12. Conclusión del Diagnóstico

**El pivot es viable y estratégicamente inteligente.** El sistema tiene una base técnica sólida — arquitectura hexagonal, seguridad implementada, monorepo configurado y 454 tests pasando — que permite redirigir el dominio de negocio sin reconstruir la infraestructura.

**El mayor esfuerzo está en el dominio de negocio nuevo**, particularmente:
1. El **algoritmo de prorrateo** (lógica de negocio pura, bien aislable)
2. La **máquina de estados del flujo de aprobación** (Borrador→Ejecutado)
3. El **módulo de reserva de equipos** con detección de conflictos
4. La **bitácora inmutable** a nivel de base de datos (INSERT-only)
5. La **generación de reportes** PDF/Excel

El equipo debería poder completar el pivot en **2-3 semanas** de trabajo intensivo, aprovechando la base ya construida.

---

*Informe generado por el agente de diseño. Para ejecutar, iniciar con Fase 1 (limpieza) y Fase 2 (diseño del nuevo sistema) antes de escribir cualquier línea de código nuevo.*
