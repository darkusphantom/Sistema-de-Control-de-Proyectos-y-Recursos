# Base de Implementación — Sistema de Control de Proyectos y Recursos

> Sucesor del alcance Red FaCyT (archivado en [`docs/archive/implementation_base_v1.md`](../archive/implementation_base_v1.md)). Define el alcance del MVP tras el pivot aprobado en [`docs/pivot-project.md`](../pivot-project.md) y el enunciado original en [`docs/PIVOT-enunciado-control-de-proyectos-quimicos.md`](../PIVOT-enunciado-control-de-proyectos-quimicos.md).

## 1. Descripción del sistema

Aplicación cliente-servidor para el **control de proyectos científicos y sus recursos** en la Facultad Experimental de Ciencias y Tecnología (FACYT). Centraliza:

- **Proyectos**: código único alfanumérico, estatus operativo, nivel de prioridad, métricas (% avance físico y % ejecución presupuestaria).
- **Inventario**: catálogo unificado de materia prima y consumibles, alertas de stock mínimo configurable, registro de lotes de compra (fecha, costo, proveedor).
- **Equipos**: catálogo de equipos/maquinaria con estado operacional y módulo de reserva previa con control de conflictos.
- **Despachos**: bitácora inmutable de salida de almacén.
- **Solicitudes de gasto**: flujo Borrador → Pendiente → Aprobado/Rechazado → Ejecutado.
- **Prorrateo (overhead)**: cálculo automático al cierre de período con criterios proporcional al consumo y equitativo.
- **Dashboard ejecutivo**: KPIs y alertas críticas.
- **Reportes**: exportación PDF y Excel.
- **Auditoría**: log inmutable (timestamp, user, IP).

## 2. Requisitos funcionales mínimos (MVP)

| # | Requisito |
| --- | --- |
| a | Arquitectura cliente-servidor: frontend Next.js (App Router) + API REST (Hono) en monorepo pnpm. |
| b | Autenticación con Better Auth (Scrypt) y **control de acceso por rol server-side**. |
| c | CRUD de proyectos con código único, estatus (Propuesta / En ejecución / Suspendido / Finalizado) y prioridad (Crítica / Alta / Media / Baja). |
| d | Cambio de prioridad con justificación obligatoria registrada en bitácora. |
| e | Catálogo de recursos con alertas de stock mínimo y lotes de compra. |
| f | Catálogo de equipos con reserva previa y detección de conflictos de horario. |
| g | Máquina de estados de solicitudes de gasto (Borrador → Pendiente → Aprobado/Rechazado → Ejecutado). |
| h | Validación de datos en frontend y backend (Zod como fuente de verdad compartida). |
| i | Dashboard ejecutivo con KPIs y alertas. |
| j | Prorrateo de consumibles compartidos al cierre de período (proporcional + equitativo) en dominio puro con TDD. |
| k | Bitácora inmutable: despachos y audit log INSERT-only. |
| l | Exportación PDF/Excel de reportes (mínimo: proyectos y consumo por período). |
| m | UI moderna responsive estilo Apple, modo claro/oscuro, en español. |
| n | Seeders con datos ficticios y scripts SQL de estructura (DDL) en PostgreSQL. |
| o | README con guía de instalación y **archivo de prompts utilizados** (`prompts.md`, requisito del enunciado). |

## 3. Matriz de roles

| Rol | Código | Acceso |
| --- | --- | --- |
| Administrador del Sistema | `admin_sistema` | Usuarios, catálogos, auditoría, parámetros, reportes |
| Coordinador de Proyecto | `coordinador` | Sus proyectos: avances, recursos, solicitudes de gasto |
| Aprobador / Gestor de Inventario | `aprobador` | Aprobar/rechazar solicitudes, almacén, reservas, prioridades, prorrateo |

El registro público solo crea `coordinador`; `aprobador` y `admin_sistema` se asignan operativamente desde `/admin` (o seed en producción). Los beneficiarios y personal general de laboratorios **no tienen usuario**.

## 4. Stack

| Capa | Elección |
| --- | --- |
| Frontend | Next.js 16 (App Router), TypeScript 5, Tailwind CSS 4, Vitest + Testing Library (≥ 80%) |
| API | Hono 4 + Better Auth, validación Zod, patrón hexagonal (puertos en `domain/`, adaptadores en `infrastructure/`) |
| Dominio compartido | `@redfacyt/shared` (tipos, enums, esquemas Zod) |
| Base de datos | PostgreSQL (adaptadores `infrastructure/repositories/postgres/`, migraciones, seeders) |
| Calidad | Husky pre-commit: `pnpm -r lint` + `pnpm -r test:coverage` ≥ 80% |

## 5. Fuera del alcance (eliminado con el pivot)

El dominio de la red social académica fue eliminado en la Fase 1 del pivot: publicaciones (`posts`), feed con filtros, taxonomía de publicaciones, moderación de visibilidad, landing de bienvenida editorial y gestión de "autores". Su historia permanece en git (`9989b02`) y los documentos en [`docs/archive/`](../archive/).

## 6. Fases de ejecución

Ver [`docs/pivot-project.md`](../pivot-project.md) §9: (1) limpieza y preparación ✅, (2) diseño estilo Apple, (3) dominio compartido y API, (4) frontend, (5) PostgreSQL e integración, (6) documentación, testing y despliegue.
