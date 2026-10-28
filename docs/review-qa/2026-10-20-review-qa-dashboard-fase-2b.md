# Review QA — Dashboard Ejecutivo `/dashboard` (Fase 2b)

> **Fecha:** 2026-10-20
> **Revisor:** `qa-reviewer`
> **Commit revisado:** `63111f5` — `feat(web): dashboard ejecutivo con KPIs, alertas y actividad`
> **Rama:** `features/dashboard`
> **Spec de referencia:** [`docs/design/wireframes_dashboard.md`](../design/wireframes_dashboard.md) §4–§7
> **Requisitos:** [`docs/roadmap-pivot.md`](../roadmap-pivot.md) §2.1

## Veredicto

**✅ APRUEBA CON OBSERVACIONES** — 0 hallazgos bloqueantes.

| Severidad | Nº | Naturaleza |
| --- | --- | --- |
| 🔴 Bloqueante | 0 | — |
| 🟡 Mayor | 4 | 1 defecto real de accesibilidad, 1 divergencia de spec, 1 debilidad de tests, 1 riesgo de determinismo |
| 🔵 Menor | 5 | naming, `aria`, tipado, localización, duplicación menor |
| 💡 Sugerencia | 4 | rendimiento, UX, refactor |

## Verificación de métricas

El revisor **no pudo ejecutar comandos** en su sesión (shell denegado). Las métricas fueron verificadas de forma independiente por el agente coordinador:

| Verificación | Comando | Resultado |
| --- | --- | --- |
| Tests web | `npx vitest run` | **428/428 pasan** (50 archivos) |
| TypeScript | `npx tsc --noEmit` | **OK** |
| ESLint | `npx eslint --max-warnings 0 src` | **OK** |
| Cobertura | `npx vitest run --coverage` | 95.38% stmts · 87.72% branches · 96.66% funcs · 96.83% lines |

Los números reportados por el `developer` quedan **confirmados**.

## Estado de cada hallazgo

| ID | Severidad | Hallazgo | Estado |
| --- | --- | --- | --- |
| 🟡-1 | Mayor | Doble `<h2>` anidado por `EmptyState` dentro de secciones con `h2` | ✅ Corregido |
| 🟡-2 | Mayor | Divergencia con spec §7 (sin `useMemo`; pre-cómputo en servidor) | ✅ Documentado |
| 🟡-3 | Mayor | Assertions débiles en tests de período (`getAllByText`, `>=`) | ⏳ Deuda diferida |
| 🟡-4 | Mayor | `new Date()` dentro de `getSnapshot` (bases temporales distintas) | ✅ Corregido |
| 🔵-1 | Menor | `as never` en `project-distribution.tsx` | ✅ Corregido |
| 🔵-2 | Menor | `<time>` puede quedar vacío si `formatRelativeTime` devuelve `""` | ⏳ Deuda diferida |
| 🔵-3 | Menor | Locale `es-VE` + `$` hardcodeado (documentado) | ✅ Documentado |
| 🔵-4 | Menor | `progressbar` sin `aria-valuenow` cuando el valor es `null` | ✅ Corregido |
| 🔵-5 | Menor | `h1` con clase `text-h2` (conforme a spec §4) | ✅ Documentado |
| 💡-1 | Sugerencia | `KpiCard` deriva `danger` de un string formateado | ⏳ Deuda diferida |
| 💡-2 | Sugerencia | Extraer `PeriodSelector` reutilizable | ⏳ Deuda diferida |
| 💡-3 | Sugerencia | "Ver todas" siempre visible aunque no haya más filas | ⏳ Deuda diferida (conforme a spec) |
| 💡-4 | Sugerencia | Payload de 4 snapshots completos al cliente | ⏳ Deuda diferida (Fase 5) |

## Correcciones aplicadas

Commit de correcciones posterior al review (ver `git log` y `progress.md`).

| Archivo | Cambio |
| --- | --- |
| `apps/web/src/components/shared/empty-state.tsx` | Nuevo prop `titleAs?: "h2" \| "h3" \| "p"` (default `"h2"`), backwards-compatible |
| `apps/web/src/components/shared/empty-state.test.tsx` | +3 tests del prop `titleAs` |
| `apps/web/src/components/dashboard/project-progress.tsx` | `titleAs="p"` en el `EmptyState`; `aria-valuetext="Sin dato"` cuando `progress === null` |
| `apps/web/src/components/dashboard/project-progress.test.tsx` | +2 tests (jerarquía de encabezados y `aria-valuetext`) |
| `apps/web/src/components/dashboard/activity-feed.tsx` | `titleAs="p"` en el `EmptyState` |
| `apps/web/src/components/dashboard/activity-feed.test.tsx` | +1 test de jerarquía de encabezados |
| `apps/web/src/components/dashboard/project-distribution.tsx` | `as never` → `Set<string>` (`CANONICAL_STATUS_LABELS`) |
| `apps/web/src/lib/repositories/dashboard-repository.ts` | `getSnapshot(period, now?)` — referencia temporal inyectable |
| `apps/web/src/lib/repositories/dashboard-repository.static.ts` | `now: Date = new Date()` como parámetro (antes `new Date()` interno) |
| `apps/web/src/app/(main)/dashboard/page.tsx` | Un único `now` compartido por los 4 snapshots y `nowIso` |
| `apps/web/src/components/dashboard/kpi-grid.tsx` | JSDoc del formato `es-VE` + `$` (justificación de la spec §5.2) |
| `apps/web/src/components/dashboard/dashboard-header.tsx` | Comentario: `text-h2` en el `h1` es intencional (spec §4) |

### Verificación post-corrección

| Verificación | Resultado |
| --- | --- |
| Tests web | **434/434 pasan** (50 archivos; +6 respecto al review) |
| `tsc --noEmit` | **OK** |
| `eslint --max-warnings 0` | **OK** |

## Deudas diferidas (justificación)

- **🟡-3** — Requiere valores deterministas del fixture y selectores inequívocos por card. Se aborda junto con el endurecimiento general de la suite.
- **🔵-2** — Con `filterByPeriod` y el fixture actual el `<time>` vacío no ocurre; se resolverá con un fallback no vacío.
- **💡-1, 💡-2** — Refactor opcional, sin impacto funcional.
- **💡-3** — La implementación **es conforme a la spec §5.1** ("máximo 5 filas + enlace Ver todas"); cambiarlo es una decisión del `designer`, no un defecto.
- **💡-4** — Anotado como deuda de Fase 5 (cuando el adapter lea PostgreSQL con volúmenes reales).

---

## Hallazgos detallados

### 🟡-1. Encabezado duplicado por `EmptyState` anidado — *defecto real de accesibilidad*

- **Ubicación:** `apps/web/src/components/dashboard/project-progress.tsx:64,72`; `apps/web/src/components/dashboard/activity-feed.tsx:89,94`
- **Problema:** `EmptyState` (`apps/web/src/components/shared/empty-state.tsx:55`) renderiza su título como `<h2>`. Al insertarlo dentro de una `<section aria-labelledby>` que ya tiene su propio `<h2>`, quedan **dos encabezados de nivel 2 hermanos** en la misma región.
- **Impacto:** la spec §8 exige "`h2` por sección; orden de encabezados sin saltos". Con el estado vacío activo, el outline del documento deja de reflejar la estructura visual y un lector de pantalla anuncia dos encabezados de sección en la misma región.
- **Corrección aplicada:** nuevo prop opcional `titleAs?: "h2" | "h3" | "p"` (default `"h2"`) en `EmptyState`, y uso de `"p"` en las secciones que ya tienen `h2`. Backwards-compatible: los consumidores existentes no cambian.

### 🟡-2. Divergencia con la spec §7 sobre el mecanismo de recálculo

- **Ubicación:** `apps/web/src/app/(main)/dashboard/page.tsx`; `apps/web/src/components/dashboard/dashboard-view.tsx`
- **Problema:** la spec §7 describe "el snapshot se guarda en estado local del cliente y se recalcula con `useMemo`". La implementación pre-resuelve los **4 snapshots en el servidor** (`Promise.all`) y el cliente solo indexa `snapshots[period]`, sin `useMemo`.
- **Evaluación:** la desviación es **técnicamente preferible** — evita el waterfall de fetch y no mueve cómputo al navegador. El problema era de **trazabilidad**: no estaba registrada.
- **Resolución:** decisión documentada en §7 del propio wireframe y en `docs/architecture/progress.md`. El payload de 4 períodos queda anotado como deuda de Fase 5 (💡-4).

### 🟡-3. Assertions débiles en los tests de cambio de período — *diferido*

- **Ubicación:** `apps/web/src/components/dashboard/dashboard-view.test.tsx:44,56`; `apps/web/src/app/(main)/dashboard/page.test.tsx:71`
- **Problema:** `expect(screen.getAllByText("12").length).toBeGreaterThan(0)` no verifica que se haya intercambiado el snapshot del período correcto; `expect(alertsAfter).toBeGreaterThanOrEqual(alertsBefore)` pasa incluso si el selector fuera no-op (los períodos son anidados).
- **Impacto:** una regresión que ignore el período no rompería estos tests.
- **Resolución:** **diferido**. Requiere valores deterministas del fixture y selectores inequívocos (por `aria-label` del progressbar o `data-testid` por card). Se aborda junto con el endurecimiento de la suite.

### 🟡-4. `getSnapshot` sin `now` inyectado

- **Ubicación:** `apps/web/src/lib/repositories/dashboard-repository.static.ts:127`
- **Problema:** cada llamada a `getSnapshot` crea su propio `new Date()`. Al resolverse 4 en paralelo (`Promise.all`), los snapshots pueden basarse en instantes ligeramente distintos, y el `nowIso` de la vista es una **cuarta** instancia.
- **Impacto:** en fase estática es cosmético (probabilidad nula de cruzar medianoche), pero se convierte en defecto real cuando el adapter consulte PostgreSQL: dos llamadas de la misma petición podrían abarcar el cambio de medianoche e devolver períodos incoherentes.
- **Nota:** **no** es la deuda ya registrada ("KPIs de proyecto sin filtrar por período"); es la ausencia de una referencia temporal única e inyectada en el puerto.
- **Corrección aplicada:** parámetro opcional `now: Date` en `getSnapshot(period, now = new Date())`; `page.tsx` calcula **un único** instante y lo usa para los 4 snapshots y para `nowIso`. El adapter pasa a ser determinista y testeable sin depender del reloj real, en línea con `metrics.ts`.

### 🔵-1. `as never` como cast en `project-distribution.tsx`

- **Ubicación:** `apps/web/src/components/dashboard/project-distribution.tsx:50`
- **Problema:** `CANONICAL_STATUS_ORDER.includes(entry.label as never)` usa el cast más laxo para silenciar un desajuste de tipos entre la tupla `readonly` y `string`.
- **Corrección aplicada:** ampliar el orden a `readonly string[]` y eliminar el cast.

### 🔵-2. `<time>` potencialmente vacío — *diferido*

- **Ubicación:** `apps/web/src/components/dashboard/activity-feed.tsx:38-60,114`
- **Problema:** `formatRelativeTime` devuelve `""` para fechas futuras o inválidas, dejando un `<time dateTime="...">` sin texto accesible.
- **Resolución:** **diferido**. Con `filterByPeriod` y el fixture actual el caso no ocurre; se resolverá con un fallback no vacío o no renderizando el elemento.

### 🔵-3. Locale `es-VE` con `$` hardcodeado

- **Ubicación:** `apps/web/src/components/dashboard/kpi-grid.tsx:29`
- **Problema:** se formatea con `Intl.NumberFormat("es-VE")` y se antepone `"$"` manualmente, mientras el resto del proyecto usa `es-ES` (`lib/format.ts`).
- **Resolución:** **conforme al wireframe**, que muestra `$45.000` (separador de miles es-VE). Se documenta el motivo con un comentario en el código; extraer un `formatAmount` reutilizable queda como sugerencia futura.

### 🔵-4. `progressbar` sin `aria-valuenow` cuando el valor es `null`

- **Ubicación:** `apps/web/src/components/dashboard/project-progress.tsx:98`
- **Problema:** `aria-valuenow={progress === null ? undefined : safeProgress}` deja un `role="progressbar"` **indeterminado** cuando no hay dato, cuando la intención es "sin dato", no "en progreso".
- **Corrección aplicada:** exponer `aria-valuetext="Sin dato"` en ese caso y mantener el valor numérico cuando existe.

### 🔵-5. `h1` con clase `text-h2`

- **Ubicación:** `apps/web/src/components/dashboard/dashboard-header.tsx:107`
- **Resolución:** **conforme a la spec §4** ("`h1` con `text-h2`"). Se añade nota en el JSDoc para evitar que una futura revisión de escala tipográfica "corrija" la intención.

---

## Aspectos positivos verificados

1. **Arquitectura hexagonal correcta:** `DashboardRepository` es un puerto puro, el adapter `.static` no filtra infraestructura y el **contract test** verifica forma del snapshot, coherencia, filtrado y no-mutación del fixture. Sustituirlo por PostgreSQL no requiere tocar consumidores.
2. **Dominio puro y determinista:** `metrics.ts` aísla 8 funciones puras, **inyecta `now`** y documenta criterios (redondeo, `null` vs `0`) en el encabezado del módulo.
3. **Big O correcto y coincidente con el JSDoc:** verificado función por función (`weightedPhysicalProgress` O(n), `budgetExecution` O(1), `countByKey` O(n) con `Map`, `filterByPeriod` O(n), `sumMetric` O(n)).
4. **Guardas de casos borde:** división por cero → `pct: null` (nunca `NaN`/`Infinity`), pesos negativos neutralizados, fechas inválidas descartadas.
5. **`null` → `—` consistente** con `KPI_EMPTY_VALUE` centralizado.
6. **Accesibilidad:** un solo `h1`, radiogroup con roving `tabindex` + flechas + Home/End **con 8 tests de teclado**, badges siempre con texto (SC 1.4.1), `<time dateTime>`, targets ≥44px, iconos decorativos `aria-hidden`.
7. **Límites de la spec respetados:** máx. 5 alertas, máx. 6 filas de avance, máx. 6 actividades, con `.slice()` y tests.
8. **Umbrales de color** coincidentes con §5.3 y tokens existentes en `globals.css`.
9. **Sin dependencias nuevas**, sin `any` (tras 🔵-1), código en inglés / UI y JSDoc en español.
10. **Badge `danger`** añadido de forma aditiva y backwards-compatible, con test dedicado.

---

## Referencias

- Commit: `63111f5`
- Spec: [`docs/design/wireframes_dashboard.md`](../design/wireframes_dashboard.md)
- Deudas: [`docs/roadmap-pivot.md`](../roadmap-pivot.md) §2.1
- Estado: [`docs/architecture/progress.md`](../architecture/progress.md)
