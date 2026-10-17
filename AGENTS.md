# AGENTS.md — Red FaCyT

Guía maestra de Red FaCyT para agentes de IA. **Debe leerse completa antes de cualquier tarea.** Define cómo trabajar: proyecto, equipo, roles, flujo de trabajo, estándares, seguridad, documentación y gestión con Kanban.

> **Idioma**: código en inglés; documentación, comentarios y contenido de página en español (regla del equipo).
> Este archivo es la **fuente de verdad** del flujo de trabajo. Los agentes especializados viven en `.opencode/agents/*.md` y los workflows en `.agents/workflows/*.md`.

---

## 1. Proyecto

**Sistema de Control de Proyectos y Recursos** — gestión de proyectos científicos y sus recursos (inventario, equipos, despachos, solicitudes de gasto, prorrateo, reportes y auditoría) en la Facultad Experimental de Ciencias y Tecnología (FACYT). Proyecto pivoteado desde "Red FaCyT" (red de publicación académica; ver [`docs/archive/`](docs/archive/)).

- **Enunciado del pivot**: [`docs/PIVOT-enunciado-control-de-proyectos-quimicos.md`](docs/PIVOT-enunciado-control-de-proyectos-quimicos.md)
- **Plan de pivot**: [`docs/pivot-project.md`](docs/pivot-project.md)
- **Objetivo y reglas del proyecto**: [`OBJECTIVE.md`](OBJECTIVE.md)
- **Alcance de implementación**: [`docs/implementation/implementation_base.md`](docs/implementation/implementation_base.md)
- **Arquitectura frontend (inmutable)**: [`docs/architecture/frontend-structure.md`](docs/architecture/frontend-structure.md)
- **Estado real**: [`docs/architecture/progress.md`](docs/architecture/progress.md)
- **Diseño**: [`docs/design/`](docs/design/)
- **Seguridad / joyas de la corona**: [`docs/security/crown-jewels.md`](docs/security/crown-jewels.md)
- **Tablero Kanban**: [`docs/trello/board.json`](docs/trello/board.json)

## 2. Equipo y responsabilidades

| Miembro | Rol | Área |
| --- | --- | --- |
| **Luis Rodríguez** | Frontend | Next.js/React, UI, componentes, integración con API |
| **José Contín** | Backend | Lógica de negocio, base de datos, integración |
| **Miguel** | Backend + Ciberseguridad | API, seguridad desde el diseño, blue team / red team |

- **Miguel** es analista de ciberseguridad nivel 2: además de desarrollar la API, vela porque la seguridad esté presente **desde el diseño** (security by design) y coordina los equipos azul (defensa) y rojo (pentesting).
- Todos participan en análisis, diseño, desarrollo, prueba, documentación y defensa.

## 3. Flujo de trabajo (pipeline obligatorio)

Las fases **no se saltan ni se mezclan** (regla de `OBJECTIVE.md`):

```
Diseño → Implementación → Review → Testing → Documentación → Despliegue
```

| Fase | Agente | Entregable |
| --- | --- | --- |
| Diseño | `designer` | Guías en `docs/design/` |
| Implementación | `developer` | Código TDD con JSDoc |
| Review | `qa-reviewer` + `security-reviewer` + `security-architect` | Reportes por severidad |
| Testing | `tester` | Evidencia en `docs/tests/` |
| Documentación | todos | `progress.md`, `docs/` |
| Despliegue | `devops` | Build, CI/CD, verificación |
| Seguridad ofensiva/defensiva | `red-team` / `blue-team` | Auditoría / endurecimiento |

Cada implementación debe pasar review, testing y documentación antes de darse por terminada.

## 4. Estrategia de ramas y control de versiones

- **Formato de ramas** (estándar del equipo): `tipo/nombre-función`
  - `feature/auth`, `fix/login`, `docs/feed`, `refactor/...`
  - Tipos: `feature`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`.
- Cada miembro crea su rama para el componente que desarrolla. **Si la rama ya está en uso por otra persona**, se crea otra con prefijo del responsable (ej. `miguel-SERVICIO`).
- Rama principal de integración: `develop`. `main` solo recibe versiones estables/entregas.
- **Commits atómicos y convencionales** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`).
- **Nunca comitear sin autorización expresa del usuario.**
- No hacer push directo a `main` ni a `develop` salvo indicación.

## 5. Estándares de código (reglas de `OBJECTIVE.md`)

- **Idioma**: código en inglés, legible, sin abreviaturas; **documentación, comentarios y contenido de página en español**.
- **TDD**: escribir/actualizar tests primero (Vitest), luego implementación.
- **JSDoc** obligatorio en toda función/método/componente público.
- **Patrones de diseño** y análisis de complejidad asintótica (Big O) en puntos críticos.
- **Arquitectura hexagonal / patrón repositorio**: respetar interfaces de `src/lib/repositories/` para que el backend sea plug-and-play sin rework del frontend.
- **Husky pre-commit**: `pnpm lint` + `pnpm test:coverage` con cobertura **≥ 80%**.
- **Estructura de carpetas** respetada; no colocar archivos fuera de su lugar sin preguntar.
- Comandos: `pnpm dev`, `pnpm test`, `pnpm test:coverage`, `pnpm lint`, `pnpm build`.

## 6. Seguridad (prioridad alta — perfil de Miguel)

La seguridad es **parte del diseño, no un añadido final** (security by design).

### 6.1 Joyas de la corona

Leer SIEMPRE [`docs/security/crown-jewels.md`](docs/security/crown-jewels.md): define los activos críticos de la plataforma y qué protecciones son obligatorias. La prioridad de seguridad sigue ese documento.

### 6.2 Agentes de seguridad

| Agente | Equipo | Responsabilidad |
| --- | --- | --- |
| `security-architect` | Diseño seguro | Define el modelo de amenaza, revisa diseño de API/DB con OWASP, garantiza seguridad desde el diseño |
| `blue-team` | Defensa | Implementa controles (cabeceras, rate limiting, auth, validación, CSP, cookies), mitiga hallazgos, skill `seguridad` |
| `red-team` | Ofensiva | Pentesting de la aplicación/API, skill `pentesting`, reporte por severidad, sin modificar código |
| `security-reviewer` | Auditoría | Audita código y PostgreSQL/RLS, OWASP Top 10, reporta sin modificar |

### 6.3 Reglas de seguridad mínimas (MVP §5.h)

- Validación de datos en **frontend y backend**.
- Protección de rutas privadas.
- Contraseñas con hash (**nunca texto plano**).
- Control de acceso por rol (Coordinador / Aprobador / Admin del Sistema) **en el servidor** (enforcement server-side, nunca solo cliente).
- Manejo básico de errores sin exponer información sensible.
- No exponer secretos ni datos sensibles en el repo ni en bundles.

## 7. Documentación (regla estricta)

- **`docs/architecture/frontend-structure.md`** es **INMUTABLE** — solo cambia con refactor de arquitectura aprobado.
- **`docs/architecture/progress.md`** es **DINÁMICO** — se actualiza SIEMPRE tras cada implementación, corrección o prueba. Una implementación sin estado documentado se considera **incompleta**.
- Diseño en `docs/design/`; evidencia de pruebas en `docs/tests/`; seguridad en `docs/security/`.
- La skill `project-context` es de lectura obligatoria al iniciar cualquier tarea.

## 8. Gestión con Kanban (Trello)

- Tablero único: [`docs/trello/board.json`](docs/trello/board.json) (`boardId`, columnas, labels).
- Columnas: `Pendiente → En análisis → En desarrollo → En prueba → En revisión → Terminado`.
- Cada tarjeta: nombre, responsable, estado, prioridad, fecha estimada, descripción y evidencia/enlace.
- Agente `product-manager` gestiona el tablero (crear tarjetas con checklist, labels de prioridad + tipo, mover estados, registrar evidencia).
- El Kanban es **evidencia del proceso**, no decoración: refleja el avance real.

## 9. Reglas transversales para agentes

1. Leer `project-context` y los documentos obligatorios antes de actuar.
2. Respeta el pipeline: si la tarea no es de tu fase, delega al agente correcto.
3. Código en inglés / documentación y UI en español.
4. No commits sin autorización. No editar archivos "inmutables" sin aprobación.
5. Reportar siempre: archivos tocados, decisiones tomadas, estado resultante.
6. Las consultas directas a BD solo de lectura; cualquier modificación se entrega como código revisado para que el humano lo ejecute.