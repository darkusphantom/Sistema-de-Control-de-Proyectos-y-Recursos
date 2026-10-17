# Cómo usar los agentes de desarrollo

Este documento es la guía de referencia para usar los agentes que integran el pipeline de desarrollo de **Red FaCyT**. Los agentes están definidos en `.opencode/agents/*.md` y se invocan pidiéndole la tarea al agente correspondiente desde el chat.

## Qué son los agentes

Son **subagentes especializados** configurados en `.opencode/agents/`. Cada uno tiene:

- Un **rol** definido (instrucciones de sistema).
- **Permisos** restringidos (p. ej. solo lectura, solo Trello, o shell completo).
- Un conjunto de **skills** que puede cargar para aplicar mejores prácticas.

No deben usarse como "echar cualquier tarea a cualquiera": cada agente cubre una fase del pipeline definido en `OBJECTIVE.md`:

```
Diseño → Implementación → Review → Testing → Documentación → Despliegue
```

No se puede saltar ninguna fase. Por cada funcionalidad debe pasar su review, testing y documentación.

## Tabla resumen

| Agente | Fase del pipeline | Rol | Cuándo invocarlo |
| --- | --- | --- | --- |
| `designer` | Diseño | Dirección visual y funcional de la UI (brief, wireframes, tokens, accesibilidad) | Antes de implementar cualquier UI nueva o rediseño |
| `developer` | Implementación | Código full-stack Next.js + PostgreSQL (UI, Server Actions/API, datos, auth) con TDD y JSDoc | Al pasar de diseño a código o resolver tareas de código |
| `qa-reviewer` | Review | Revisión de calidad (corrección, mantenibilidad, rendimiento, arquitectura, a11y) sin modificar código | Después de implementar o antes de integrar una feature |
| `security-reviewer` | Review / pre-producción | Auditoría de seguridad end-to-end (OWASP, auth, autorización, RLS/PostgreSQL) sin modificar código | En la fase de revisión o antes de producción |
| `tester` | Testing | Diseño y ejecución de pruebas unitarias y E2E; evidencia en `docs/tests/` | Al pedir cobertura de pruebas o validar flujos completos |
| `devops` | Despliegue | Pipeline CI/CD, build, deploy (Vercel), variables de entorno, migraciones y verificación post-deploy | En la fase de producción/despliegue |
| `product-manager` | Transversal | Gestión del Kanban de Trello (backlog, actividades, checklist, seguimiento) | Para crear, leer, asignar o dar seguimiento a actividades |

---

## designer

### Rol
Diseñador líder de Red FaCyT. **No implementa código**: produce entregables de diseño en Markdown dentro de `docs/design/` que el agente `developer` convertirá en UI real.

### Caso de uso
- Diseñar una pantalla/flow nuevo antes de implementarlo.
- Rediseñar la interfaz con una dirección visual coherente con el contexto universitario.
- Definir tokens, componentes del design system y decisiones de accesibilidad.

### Cómo usarlo
Pídele la tarea de diseño con contexto: audiencia, pantallas a cubrir y objetivo. Aplica las skills `frontend-design`, `design-system`, `accessibility` y `ui-ux-pro-max`.

### Entregables
- `docs/design/brief.md` — concepto, audiencia, tono, paleta y tipografías.
- `docs/design/wireframes.md` — mapa de navegación y esquemas de pantallas.
- `docs/design/components.md` — tokens y componentes del design system.
- `docs/design/accessibility.md` — decisiones de accesibilidad, contraste y teclado.

### Restricciones
- No usa `bash` ni ejecuta comandos.
- Si la brief está incompleta, pregunta antes de diseñar.

### Ejemplo de uso
> Diséñame el flujo de inicio y registro del Sistema de Control de Proyectos y Recursos para coordinadores de proyecto de la Facultad Experimental de Ciencias y Tecnología. Genera brief, wireframes y componentes en `docs/design/`. Evita imitar interfaces de gestión genéricas.

---

## developer

### Rol
Desarrollador full-stack de Red FaCyT: frontend (Next.js/React) y backend (Server Actions / API Routes / Supabase). Es la fase de **implementación** del pipeline.

### Caso de uso
- Convertir un entregable de `docs/design/` en UI real.
- Implementar una funcionalidad de extremo a extremo (datos, autenticación, Server Actions, API).
- Resolver tareas de código respetando estándares del proyecto.

### Cómo usarlo
- Si hay diseño, los entregables están en `docs/design/` y deben respetarse.
- Estrategia **TDD**: escribe/actualiza primero los tests, luego la implementación.
- Código en inglés, legible, sin abreviaturas y con **JSDoc** en cada función/método.
- Aplica los patrones del proyecto y el gate de calidad con Husky (tests con cobertura ≥ 80% pre-commit).

### Restricciones
- Respeta la estructura del proyecto: no coloques archivos fuera de su lugar sin preguntar.
- Si la tarea es de diseño, delega al agente `designer`; no la reinventes.

### Ejemplo de uso
> Implementa la vista de dashboard según los entregables de `docs/design/`. Escribe primero los tests con Vitest, después la implementación en Next.js con Server Actions. Respeta JSDoc, patrones y el código en inglés.

---

## qa-reviewer

### Rol
QA / code reviewer de Red FaCyT. Revisa el código recién escrito **sin modificarlo** y emite hallazgos accionables por severidad.

### Caso de uso
- Revisar una feature recién implementada antes de integrarla.
- Validar corrección, lógica, mantenibilidad, rendimiento, accesibilidad y estándares.

### Cómo usarlo
Dale el contexto del cambio (archivos, rama o PR). Evaluará 8 dimensiones: corrección, legibilidad, seguridad (señala graves, pero no sustituye a `security-reviewer`), rendimiento, manejo de errores, estándares, seguridad de tipos y testabilidad.

### Formato de reporte
- Resumen con archivos revisados y hallazgos por severidad.
- 🔴 **Crítico** (must fix) → 🟡 **Advertencia** (should fix) → 🔵 **Sugerencia** (could fix).
- Aspectos positivos para reforzar buenas prácticas.

### Restricciones
- No edita código (solo `git diff/log/status/show`).
- No reescribe el código completo salvo que se pida.

### Ejemplo de uso
> Revisa la feature "crear proyecto": archivos modificados en `src/app/(main)/projects`. Valora corrección, manejo de errores, rendimiento (N+1) y accesibilidad WCAG 2.2 AA. Emite hallazgos por severidad sin modificar nada.

---

## security-reviewer

### Rol
Especialista en ciberseguridad de Red FaCyT. Audita la aplicación end-to-end y la base de datos sin modificar configuración, produciendo un reporte por severidad con código refactorizado de ejemplo.

### Caso de uso
- Auditar autenticación, autorización y validación de entrada (OWASP Top 10).
- Revisar policies RLS, roles y privilegios de PostgreSQL/Supabase.
- Validar dependencias (`npm audit` / `npm outdated`), secretos y headers antes de producción.

### Cómo usarlo
Pídele una auditoría enfocada (módulo, endpoints o base de datos). Ejecuta comandos (**con autorización previa**) solo para verificar sanitización o dependencias.

### Formato de reporte
- 🚨 **Análisis de Vulnerabilidad**: tipo, criticidad (Alta/Media/Baja) y el hecho técnico.
- 🛠️ **Crítica Constructiva y Solución**: por qué falla y código seguro refactorizado.
- Si no hay problemas, lo declara explícitamente.

### Restricciones
- No modifica código. Respuestas directas, sin validación emocional ni frases de apoyo.

### Ejemplo de uso
> Audita la seguridad del módulo de autenticación: sesiones, rate limiting, IDOR en la aprobación de solicitudes y las policies RLS de las tablas de proyectos y recursos. Reporta por severidad con el código refactorizado seguro.

---

## tester

### Rol
Tester de Red FaCyT. Diseña y ejecuta pruebas (unitarias, funcionales y E2E) bajo estrategia TDD y deja evidencia en `docs/tests/`.

### Caso de uso
- Diseñar casos de prueba desde historias de usuario y criterios de aceptación.
- Escribir pruebas unitarias (Vitest/Jest) y E2E (Playwright) de flujos completos.
- Ejecutar las suites y documentar resultados con trazabilidad.

### Cómo usarlo
Pídele cubrir un flujo o módulo concreto. Usa las skills `webapp-testing`, `frontend-patterns`, `web-quality-audit` y `benchmark-optimization-loop` cuando apliquen.

### Entregables
- Casos de prueba en `docs/tests/`: casos, pasos, datos, resultado esperado/real y evidencia.
- Cada fallo se informa con trazabilidad (archivo/línea) y el paso que lo reproduce.

### Restricciones
- No modifica código de producción; solo tests y documentación de pruebas.

### Ejemplo de uso
> Diseña y ejecuta las pruebas E2E del flujo de solicitudes de gasto: registro → login → crear solicitud → aprobar/rechazar → despachar. Incluye casos borde (campos vacíos, conflictos de reserva) y deja la evidencia en `docs/tests/`.

---

## devops

### Rol
DevOps de Red FaCyT. Lleva la aplicación a producción de forma reproducible, verificada y reversible.

### Caso de uso
- Configurar el pipeline CI/CD (lint → test → build → deploy).
- Desplegar en Vercel/Netlify y gestionar variables de entorno como secretos.
- Aplicar migraciones de Supabase y verificar policies/RLS antes de publicar.
- Verificación post-despliegue: health checks, rutas clave, assets y Core Web Vitals.

### Cómo usarlo
Pídele preparar o ejecutar el despliegue. Documenta los pasos y decisiones en `README.md` o `docs/deployment`. Define también plan de rollback y monitoreo básico.

### Restricciones
- No sube secretos al repositorio; usa las herramientas de secretos de la plataforma.

### Ejemplo de uso
> Prepara el despliegue a producción en Vercel: configura GitHub Actions (lint → test → build → deploy), variables de entorno como secretos, aplica las migraciones de Supabase y verifica post-deploy (página inicial, rutas clave y Core Web Vitals). Documenta el proceso en `docs/deployment`.

---

## product-manager

### Rol
Product manager de Red FaCyT. Gestiona el tablero Kanban de **Trello** del proyecto: planifica el backlog, crea y asigna actividades con checklist, mueve tarjetas entre estados, etiqueta por prioridad/tipo y reporta el avance. **No edita código.**

### Caso de uso
- Crear una actividad nueva con su checklist, responsable, fecha, prioridad y tipo.
- Asignar una tarjeta, moverla entre columnas o dar seguimiento a su progreso.
- Reportar avance del proyecto (tareas por columna, % de checklist completado).

### Cómo usarlo
- Siempre lee `docs/trello/board.json` antes de operar: contiene el `boardId`, `url`, columnas y etiquetas del único tablero permitido.
- Columnas: `Pendiente` → `En análisis` → `En desarrollo` → `En prueba` → `En revisión` → `Terminado`.
- Cada tarjeta lleva **una prioridad** (`Alta`/`Media`/`Baja`) y **un tipo** (`feature`/`fix`/`refactor`/`docs`/`test`/`chore`/`perf`) como labels.
- Marca el progreso real de las subtareas y registra evidencia/enlaces como comentarios.

### Restricciones
- Solo existe para ese tablero; nunca usa ids fuera de `board.json`.
- No duplica tarjetas; si la actividad existe, la actualiza o mueve.
- No usa `bash`, no edita archivos ni accede a otras MCP (Notion/Supabase).

### Ejemplo de uso
> Crea la tarjeta "Implementar alertas de stock mínimo" en Pendiente con checklist (diseñar catálogo, definir umbrales, tests), responsable developer, etiquetas Alta + feature. Luego muévela a En desarrollo y reporta el avance del tablero.

---

## Flujo de trabajo recomendado

Para cada funcionalidad nueva, se recorre el pipeline completo sin saltar fases:

1. **Diseño** → invocar `designer` (entregables en `docs/design/`).
2. **Implementación** → invocar `developer` (TDD, JSDoc, patrones; consuma `docs/design/`).
3. **Review** → invocar `qa-reviewer` y `security-reviewer` (reportes por severidad, sin modificar nada).
4. **Testing** → invocar `tester` (evidencia en `docs/tests/`).
5. **Documentación** → los entregables ya documentados suben a `docs/` en cada fase.
6. **Despliegue** → invocar `devops` (build, CI/CD, migraciones, verificación post-deploy).

Paralelamente, `product-manager` registra y da seguimiento a todo: al terminar una tarea se marcan sus checklists y se avanza la tarjeta hasta `Terminado`, dejando comentarios con la evidencia.

## Notas finales

- Las definiciones completas de cada agente están en `.opencode/agents/*.md`; este documento es la guía de uso.
- El pipeline obligatorio está en `OBJECTIVE.md`.
- `explore` es un agente **nativo de opencode** (exploración rápida de codebase), no forma parte del pipeline de este proyecto.
- Si una tarea no corresponde a tu fase actual, respeta el pipeline y delega al agente correcto.