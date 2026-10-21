# Dashboard Ejecutivo `/dashboard` — Sistema de Control de Proyectos y Recursos

> [!NOTE]
> Documento de **fase de diseño**. Fecha: 2026-10-20. Rol: `designer`.
> Especifica la vista `/dashboard` (Fase 2a del pivot) siguiendo el
> **§2.1 del [`roadmap-pivot.md`](../roadmap-pivot.md)** ("qué debe mostrar" +
> "recomendaciones"). Sustituye el placeholder de
> `src/app/(main)/dashboard/page.tsx` y pasa a ser la especificación de la
> pantalla (mismo patrón que `wireframes_admin.md` para `/admin`).
>
> **Estado de tokens**: se especifica con los **tokens actuales**
> (`--accent` ámbar `#d97706`, `--primary` azul institucional), **no** con el
> azul Apple `#0071E3`: la migración de identidad visual estilo Apple es
> **Fase 4** del pivot (`docs/pivot-project.md` §8). Los componentes se
> construyen con variables CSS, por lo que el cambio de acento en Fase 4 será
> cosmético, sin retrabajo estructural.

---

## 1. Propósito y alcance

### 1.1 Qué especifica este documento

La página `/dashboard`, **visible para todos los roles** (`coordinador`,
`aprobador`, `admin_sistema`), como vista de alto nivel para toma de decisiones:

| Sección | Función |
| ------- | ------- |
| **Cabecera** | Título "Dashboard", fecha/hora actual, selector de período (Hoy/Semana/Mes/Trimestre) |
| **KPIs** | Cards grandes: proyectos activos, en ejecución, presupuesto ejecutado vs. total, % avance físico global, alertas de stock críticas |
| **Alertas críticas** | Stock bajo mínimo, equipos en mantenimiento, reservas por vencer, solicitudes pendientes de aprobación |
| **Gráficas/resúmenes** | Avance por proyecto (barras), distribución de proyectos por estatus/prioridad |
| **Actividad reciente** | Últimos despachos, cambios de prioridad, solicitudes recientes |
| **Acciones rápidas** | "Nuevo proyecto", "Nueva solicitud de gasto", "Registrar despacho" (**deshabilitadas en esta fase**, §1.4 D1) |

### 1.2 Qué se especifica en otro sitio y no se repite aquí

| Tema | Documento |
| ---- | --------- |
| Shell autenticado (Navbar, BottomNav, skip link, `SessionProvider`) | `frontend-structure.md` §3 |
| Tokens de color/tipografía/radio | `apps/web/src/app/globals.css` (§3 de este doc solo los referencia) |
| `Badge`, `EmptyState`, `SelectField`, `Field`, `buttonStyles` | `components.md`, `wireframes_feed.md` §6, `wireframes_auth.md` §4 |
| Priorización global de vistas del pivot | `docs/roadmap-pivot.md` §14 |
| Dominio de proyectos/inventario/solicitudes (tipos, estados) | Fase 3 del pivot (`docs/architecture/progress.md`) |

### 1.3 Decisiones confirmadas con el usuario (2026-10-20)

| # | Decisión |
| - | -------- |
| D1 | **Acciones rápidas deshabilitadas** con badge "Próximamente" (`aria-disabled`, sin enlaces rotos) hasta que existan `/projects/new`, `/expenses/new`, `/dispatches/new`. **Documentar esta deuda en `roadmap-pivot.md`**. |
| D2 | **Acento ámbar actual** (`--accent`) para los KPIs; el azul Apple `#0071E3` llega con la migración de tokens de Fase 4. |
| D3 | **Selector de período sí** (Hoy/Semana/Mes/Trimestre), simple: filtra los datos mostrados (KPIs, alertas, actividad). |
| D4 | **Wireframe primero** (`designer`), implementación después (`developer`) — se respeta el pipeline Diseño → Implementación. |

### 1.4 Fuente de requisitos

Todo lo que la vista "debe mostrar" y sus recomendaciones provienen de
`docs/roadmap-pivot.md` §2.1. Este documento **traduce esos requisitos a
especificación de interfaz** (layout, contratos de componente, estados,
accesibilidad, responsive) y resuelve los puntos que el roadmap deja abiertos.

---

## 2. Principios de diseño (del roadmap §2.1, aplicados)

1. **Jerarquía**: información crítica arriba-izquierda (alertas + KPIs primero).
2. **Cards grandes** con bordes redondeados (`--radius-lg`), íconos sutiles y
   colores neutros + acento (D2: ámbar `--accent`).
3. **Mucho espacio en blanco**: secciones separadas con `gap-8`/`gap-10`,
   padding generoso dentro de las cards (`p-5`/`p-6`).
4. **Grid responsive 2–4 columnas** para KPIs (1 col en móvil → 2 en tablet →
   4–5 en desktop).
5. **Alertas con badges** (warning/error), **clicables** para ir al detalle.
6. **Menos densidad, más legibilidad**: máximo 5–6 filas visibles por lista con
   ver "Ver todo" cuando haya más.
7. **Estados vacíos** con `EmptyState` ("No hay alertas críticas",
   "No hay proyectos activos").

---

## 3. Layout general

### 3.1 Desktop (≥1024px)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ DASHBOARD                          Hoy, 20 oct 2026 · 10:42    [Período ▾] │  ← cabecera
├────────────────────────────────────────────────────────────────────────────┤
│ ┌ ALERTAS CRÍTICAS (si las hay) ─────────────────────────┐                 │
│ │ ● Stock: Reactivo H₂SO₄ bajo mínimo      [warning]  ›  │  ← solo si hay  │
│ │ ● 3 solicitudes pendientes de aprobación  [error]   ›  │                 │
│ └─────────────────────────────────────────────────────────┘                 │
│                                                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ ┌──────────┐ ┌───────────┐  │
│ │ ▣ 12     │ │ ▶ 5      │ │ ▤ 68% / $45.000  │ │ ▓ 74%    │ │ ⚠ 2      │  │  ← KPIs
│ │ Proy.    │ │ En ejec. │ │ Presupuesto      │ │ Avance   │ │ Alertas   │  │
│ │ activos  │ │          │ │ ejecutado        │ │ físico   │ │ stock     │  │
│ └──────────┘ └──────────┘ └──────────────────┘ └──────────┘ └───────────┘  │
│                                                                            │
│ ┌─ Avance por proyecto ─────────┐  ┌─ Distribución por estatus ──────────┐ │
│ │ PRY-001 ████████████░░  80%   │  │ En ejecución  ████████  5 (50%)    │ │
│ │ PRY-002 ██████░░░░░░░░  45%   │  │ Propuesta     ████      3 (30%)    │ │
│ │ … máx. 6 filas + "Ver todo"   │  │ Suspendido    ██        1 (10%)    │ │
│ └───────────────────────────────┘  │ Finalizado    ██        1 (10%)    │ │
│ ┌─ Actividad reciente ──────────┐  └────────────────────────────────────┘ │
│ │ 🚚 Despacho DSP-014 · hoy     │  ┌─ Por prioridad ───────────────────┐  │
│ │ ⇅ PRY-002 prioridad → Alta    │  │ Crítica ● 2  Alta ● 3  Media 5   │  │
│ │ … máx. 6 filas                │  └──────────────────────────────────┘  │
│ └───────────────────────────────┘                                        │
│                                                                            │
│ ┌─ Acciones rápidas ─────────────────────────────────────────────────────┐ │
│ │ [+ Nuevo proyecto]  [+ Nueva solicitud de gasto]  [+ Registrar        │ │  ← todas con
│ │                       [Próximamente]               despacho]          │ │     badge
│ └────────────────────────────────────────────────────────────────────────┘ │     "Próximamente"
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Móvil (<768px)

```
┌──────────────────────────┐
│ DASHBOARD                │
│ Hoy, 20 oct · 10:42      │
│ [Hoy][Semana][Mes][Trim] │  ← segmented control a ancho completo
├──────────────────────────┤
│ ⚠ Alertas críticas (2) › │  ← card resumida, tap → detalle
├──────────────────────────┤
│ ┌────┐ ┌────┐            │  ← KPIs: 2 columnas
│ │12  │ │ 5  │            │
│ └────┘ └────┘            │
│ ┌────┐ ┌────┐            │
│ │68% │ │74% │            │
│ └────┘ └────┘            │
│ ┌────┐ ┌────┐            │
│ │ ⚠2 │ │    │ (1 col si  │
│ └────┘ └────┘  es impar) │
├──────────────────────────┤
│ Avance por proyecto      │  ← apiladas verticalmente
│ Distribución             │
│ Actividad reciente       │
├──────────────────────────┤
│ Acciones rápidas (stack) │
└──────────────────────────┘
```

**Reglas de grid** (Tailwind):

| Zona | Móvil | Tablet (≥640) | Desktop (≥1024) |
| ---- | ----- | ------------- | --------------- |
| KPIs | `grid-cols-2` | `grid-cols-3` | `grid-cols-5` (los 5 KPIs caben en una fila) |
| Gráficas + actividad | 1 columna apilada | 1 columna | `lg:grid-cols-2` (avance \| distribución) y debajo actividad a ancho completo o en par con distribución |
| Acciones rápidas | `grid-cols-1` stack | `grid-cols-3` | `grid-cols-3` |

---

## 4. Cabecera (`DashboardHeader`)

- **Título**: `h1` "Dashboard" con `text-h2 font-bold` (siguiendo el placeholder
  actual y la convención del shell). El `h1` es único de la página.
- **Fecha/hora actual**: texto `text-sm text-text-muted` con formato
  `es-ES` — `"Hoy, 20 de octubre de 2026 · 10:42"`. Se actualiza al montar
  (no hace falta tick por segundo; **no** genera re-renders por timer).
- **Selector de período (D3)**:
  - Desktop: `SelectField` existente (label `Período`, oculta visualmente si
    estorba — usar `sr-only` manteniendo el label accesible) con opciones
    `Hoy | Semana | Mes | Trimestre`; default **`Mes`**.
  - Móvil: mismo modelo de datos renderizado como **segmented control**
    (`role="radiogroup"` con `role="radio"` + `aria-checked`), 4 botones a
    ancho completo, target táctil ≥44px.
  - Cambiar el período **recalcula KPIs, alertas y actividad** (§7 datos).
- **Alineación**: `flex flex-col gap-1 sm:flex-row sm:items-center
  sm:justify-between`.

---

## 5. Secciones

### 5.1 Alertas críticas (`AlertsPanel`)

- **Posición**: primera card del cuerpo (arriba-izquierda, prioridad máxima del
  roadmap). **Solo se renderiza si hay alertas**; si no, no ocupa espacio (el
  estado vacío general de §6 cubre el dashboard sin datos).
- **Título de sección**: `h2` "Alertas críticas" + contador en `Badge`.
- **Fila de alerta** (componente interno `AlertItem`, botón a ancho completo):
  ```
  ● [ícono sutil]  Descripción corta            [badge tipo]        ›
  ```
  - **Tipos de badge** (texto + color, nunca solo color — SC 1.4.1):
    | Tipo | `BadgeTone` | Ejemplo |
    | ---- | ----------- | ------- |
    | Stock bajo mínimo | `warning` | "Stock" |
    | Equipo en mantenimiento | `neutral` | "Mantenimiento" |
    | Reserva por vencer | `warning` | "Reserva" |
    | Solicitud pendiente de aprobación | `danger`/`warning`* | "Aprobación" |
  - \*El `Badge` actual no tiene tono `danger`; **extender `BadgeTone` con
    `danger`** (text-`--danger`, mismo fondo `--surface-muted`) es parte del
    alcance — cambio aditivo y backwards-compatible.
- **Interacción**: cada fila es `<button>` (no `<a>` hasta que existan las
  rutas de detalle; en esta fase navega a la ruta placeholder correspondiente
  **solo si existe**, si no queda `aria-disabled` como las acciones §5.5).
  **Decisión de implementación**: en Fase 2b, si la ruta de detalle aún no
  existe, la fila se muestra **no clicable** (div con `cursor-default`) y se
  documenta igual que D1 en `roadmap-pivot.md`.
- **Límite**: máximo 5 filas visibles + enlace "Ver todas" (deshabilitado con
  "Próximamente" si no hay ruta).

### 5.2 KPIs (`KpiCard` ×5, contenedor `KpiGrid`)

Card blanca `bg-surface border border-border rounded-lg p-5` con:

```
┌─────────────────────────┐
│  [ícono 20px, sutil]    │  ← text-text-muted, aria-hidden
│  12                     │  ← valor: text-h1 font-semibold tabular-nums
│  Proyectos activos      │  ← label: text-sm text-text-muted
│  ▲ 3 vs. mes anterior   │  ← opcional, texto success/warning (si hay dato)
└─────────────────────────┘
```

| # | KPI | Valor | Ícono disponible | Fuente |
| - | --- | ----- | ---------------- | ------ |
| 1 | Proyectos activos | conteo | `HomeIcon` | `metrics.activeProjects` |
| 2 | Proyectos en ejecución | conteo | `ArrowRightIcon` | `metrics.inProgressProjects` |
| 3 | Presupuesto ejecutado vs. total | `%` + `$ ejecutado / $ total` | `TagIcon` | `metrics.budgetExecutedPct` |
| 4 | % Avance físico global | `%` con mini-barra | `SlidersIcon` | `metrics.physicalProgressPct` |
| 5 | Alertas de stock (críticas) | conteo; **si > 0, acento `--danger`** en el valor | `AlertTriangleIcon` | `metrics.criticalStockAlerts` |

- **D2**: el **ícono o el valor** del KPI puede llevar `text-accent` (ámbar)
  como acento sutil; nunca fondos saturados.
- El **KPI 5 se sitúa el último en desktop pero primero en la lógica de
  lectura móvil** no aplica: mantener orden estable 1→5 en todas las
  pantallas (consistencia); las alertas críticas ya cubren la prioridad
  arriba-izquierda.
- Valores con `tabular-nums` para evitar salto de layout al cambiar de
  período.
- **Sin dato** (`null`): mostrar `—` (em dash) y label, nunca `NaN`/`0`
  inventado.

### 5.3 Avance por proyecto (`ProjectProgress`)

- `h2` "Avance por proyecto".
- Lista de filas: `código + nombre (truncateText)` · barra `progress` · `%`.
  - Barra: `div` con `role="progressbar"`, `aria-valuenow/min/max`,
    `aria-label="Avance físico PRY-001"`; track `bg-surface-muted`, fill
    `bg-primary` con `rounded-full h-2`.
  - Color del fill por umbral: `<50%` `bg-primary`, `50–79%` `bg-accent-teal`,
    `≥80%` `bg-success` — **siempre acompañado del número** (no solo color).
- Orden: `% avance` descendente. Máximo 6 filas + "Ver todos los proyectos"
  (deshabilitado con "Próximamente" — D1).
- **Vacío**: `EmptyState` "No hay proyectos activos".

### 5.4 Distribución por estatus/prioridad (`ProjectDistribution`)

- `h2` "Distribución".
- **Por estatus** (barras horizontales compactas o lista con `Badge`):
  `Propuesta | En ejecución | Suspendido | Finalizado` con conteo y % —
  etiqueta **texto + número**, color secundario.
- **Por prioridad**: chips `Badge` con conteos
  (`Crítica`, `Alta`, `Media`, `Baja`). Colores semánticos (roadmap §3.1):
  Crítica `danger`, Alta `warning`, Media `neutral`, Baja `muted`.
  Requiere añadir tono `danger` a `BadgeTone` (compartido con §5.1).
- Ambas sublistas muestran siempre **texto de etiqueta**; el color es
  refuerzo, no portador de significado.

### 5.5 Actividad reciente (`ActivityFeed`)

- `h2` "Actividad reciente".
- Lista `<ol>` de ítems: **ícono + texto + timestamp relativo**.
  - Tipos de ítem: `dispatch` (🚚 `ArrowRightIcon`), `priority_change`
    (⇅ `SlidersIcon`), `expense_request` (`TagIcon`).
  - Texto ejemplo: `"Despacho DSP-014 — Reactivo H₂SO₄ (12 L)"`,
    `"PRY-002 cambió de prioridad: Media → Alta"`,
    `"Solicitud SG-007 de $450 pendiente de aprobación"`.
  - Timestamp: `hace 2 h`, `hace 3 d` (`text-xs text-text-muted`,
    `datetime` real en `<time dateTime>`).
- Orden: cronológico descendente. Máximo 6 ítems + "Ver bitácora"
  (deshabilitado con "Próximamente" — D1).
- **Vacío**: `EmptyState` "No hay actividad reciente en este período".

### 5.6 Acciones rápidas (`QuickActions`) — D1

- `h2` "Acciones rápidas".
- 3 cards-botón en grid (§3.1): **"Nuevo proyecto"**, **"Nueva solicitud de
  gasto"**, **"Registrar despacho"**, cada una con ícono `PlusIcon`.
- **Estado en esta fase: deshabilitadas.**
  - `<button type="button" disabled>` **o** `aria-disabled="true"` +
    `onClick` prevenido — preferencia: **`disabled` nativo** (semántica
    clara, foco manejado por el navegador, sin trampa para lectores de
    pantalla).
  - Badge `Badge tone="muted"` "Próximamente" visible junto al label.
  - Texto de ayuda (`helpText`): "Disponible en una fase posterior".
- Cuando existan las rutas (`/projects/new`, `/expenses/new`,
  `/dispatches/new`) se convierten en `<Link>` con `buttonStyles({ variant:
  "primary" })` y se retira el badge. **Esta deuda queda documentada en
  `docs/roadmap-pivot.md` §2.1 (requerido por D1).**

---

## 6. Estados globales del dashboard

| Estado | Representación |
| ------ | -------------- |
| **Cargando** | Skeleton de las secciones (`animate-pulse` sobre placeholders `bg-surface-muted` con la forma real: 5 KPI cards, 3 filas). `aria-busy="true"` en el contenedor. Mínimo necesario: mientras el repositorio (estático hoy) resuelve. |
| **Vacío total** (sin proyectos ni alertas) | `EmptyState` grande: "No hay proyectos activos" + descripción "Cuando se registren proyectos aparecerán aquí sus indicadores." |
| **Con datos** | Layout completo de §3. |
| **Error** (futuro, API) | `FormAlert`/`EmptyState` con "No se pudieron cargar los indicadores" + botón "Reintentar". Hoy no aplica (datos estáticos); se deja especificado para Fase 5. |

---

## 7. Contrato de datos (requisito para `developer`)

El repositorio `DashboardRepository` (contrato + adapter `.static`, patrón
`user-repository`) debe exponer **una sola llamada**:

```ts
type DashboardPeriod = "hoy" | "semana" | "mes" | "trimestre";

type DashboardSnapshot = {
  kpis: {
    activeProjects: number | null;
    inProgressProjects: number | null;
    budgetExecuted: number | null;      // $ ejecutado en el período
    budgetTotal: number | null;         // $ total de proyectos activos
    budgetExecutedPct: number | null;   // 0–100
    physicalProgressPct: number | null; // 0–100
    criticalStockAlerts: number | null;
  };
  alerts: DashboardAlert[];             // ya filtradas por período
  projectProgress: ProjectProgressRow[]; // máx. resuelto en UI: 6
  distribution: { byStatus: StatusCount[]; byPriority: PriorityCount[] };
  activity: ActivityItem[];             // ya filtradas y ordenadas desc
};

getSnapshot(period: DashboardPeriod): Promise<DashboardSnapshot>;
```

- **TDD obligatorio**: contract test + `lib/dashboard/metrics.ts` con funciones
  puras (promedio ponderado de avance, % de presupuesto, conteos, filtrado por
  período) — las pruebas primero.
- Los datos estáticos del fixture deben ser **realistas y consistentes**
  (el % de avance global debe derivarse de los proyectos, no estar escrito a
  mano).
- Rendering: la página puede ser Server Component; el **selector de período**
  y los estados interactivos son Client Components (`"use client"`), sin
  re-render de la página completa — el snapshot se guarda en estado local del
  cliente y se recalcula con `useMemo`.

---

## 8. Accesibilidad (checklist de aceptación)

- [ ] Un solo `h1` ("Dashboard"); `h2` por sección; orden de encabezados sin
      saltos.
- [ ] Skip link del shell lleva al contenido; el dashboard no lo rompe.
- [ ] Badges siempre con **texto** (SC 1.4.1); barras de progreso con
      `role="progressbar"` + `aria-valuenow`.
- [ ] Selector de período operable con teclado (radiogroup flechas) y con
      target táctil ≥44px.
- [ ] Acciones deshabilitadas: `disabled` + badge "Próximamente" + texto de
      ayuda; ningún enlace a ruta inexistente.
- [ ] Fechas en `<time dateTime>`; números con `tabular-nums`.
- [ ] Estados vacíos con `EmptyState` (título + descripción legibles para
      lectores de pantalla).
- [ ] Contraste AA en ambos temas usando tokens existentes
      (`--text-muted` sobre `--surface`, `--accent` sobre `--surface`).
- [ ] Sin `motion` pesado; respetar `prefers-reduced-motion` si se añade
      transición a las barras.

---

## 9. Fuera de alcance (esta fase)

- Migración de tokens estilo Apple / azul `#0071E3` → **Fase 4**.
- Rutas de detalle y creación (proyectos, gastos, despachos) → fases del
  módulo §3–§5 del roadmap; deuda D1 documentada en `roadmap-pivot.md`.
- Datos reales vía API/PostgreSQL → **Fase 5** (hoy adapter estático).
- Exportación "Resumen Ejecutivo (PDF)" (roadmap §11) → fase de reportes.
