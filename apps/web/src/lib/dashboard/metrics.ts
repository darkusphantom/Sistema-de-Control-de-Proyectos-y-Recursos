/**
 * Métricas puras del dashboard ejecutivo (`/dashboard`).
 *
 * Todas las funciones de este módulo son **puras y deterministas**: no acceden
 * a la hora del sistema ni a fuentes de datos externas. Cuando necesitan un
 * instante de referencia (filtrado por período), lo reciben como parámetro
 * `now` inyectado. Esto las hace triviales de testear y aptas para el adapter
 * estático y el futuro adapter PostgreSQL por igual.
 *
 * Criterios transversales (documentados porque afectan al contrato del
 * repositorio y a los tests):
 * - **Redondeo**: los porcentajes se redondean con `Math.round` a entero antes
 *   de devolverse, de modo que la UI nunca muestra fracciones con `tabular-nums`.
 * - **Ausencia de dato**: cuando una métrica no puede calcularse se devuelve
 *   `null`, nunca `NaN` ni un `0` inventado. La UI traduce `null` a `—`.
 *
 * Especificación de diseño: `docs/design/wireframes_dashboard.md` §5.2 y §7.
 *
 * @module lib/dashboard/metrics
 */

import type { DashboardPeriod } from "@/lib/repositories/dashboard-repository";

/**
 * Proyecto mínimo requerido para calcular las métricas del dashboard.
 *
 * Se define aquí (y no en el repositorio) para que este módulo no dependa del
 * contrato de datos: un proyecto sólo necesita los campos que las métricas
 * consumen, lo que facilita el test puro y el futuro mapeo desde la API.
 */
export type MetricProject = {
  /** Estatus del proyecto (`Propuesta`, `En ejecución`, `Suspendido`, `Finalizado`). */
  status: string;
  /** Prioridad del proyecto (`Crítica`, `Alta`, `Media`, `Baja`). */
  priority: string;
  /** Porcentaje de avance físico entre 0 y 100, o `null` si no hay dato. */
  physicalProgress: number | null;
  /** Presupuesto total del proyecto en la moneda local, o `null` si no hay dato. */
  budgetTotal: number | null;
  /** Presupuesto ejecutado del proyecto, o `null` si no hay dato. */
  budgetExecuted: number | null;
};

/** Criterio de ponderación elegido para el avance físico global. */
export const PHYSICAL_PROGRESS_CRITERION =
  "presupuesto total del proyecto como peso; los proyectos sin presupuesto o sin avance se excluyen";

/**
 * Calcula el porcentaje de avance físico global **ponderado**.
 *
 * Criterio de ponderación (documentado en `PHYSICAL_PROGRESS_CRITERION`): cada
 * proyecto pesa según su `budgetTotal`, de forma que un proyecto de mayor
 * presupuesto influye más en la media. Un proyecto se excluye del cálculo si
 * `budgetTotal` es `null`/`0` o si `physicalProgress` es `null`, para no
 * introducir ceros ficticios. Si ningún proyecto es ponderable, devuelve `null`.
 *
 * El peso se toma en valor absoluto para tolerar datos con signo negativo sin
 * producir un denominador inválido.
 *
 * @param projects - Proyectos candidatos (se filtra a los que tienen datos completos).
 * @returns El porcentaje ponderado redondeado (0–100), o `null` si no hay datos.
 * @complexity O(n) — una sola pasada sobre `n` proyectos.
 */
export function weightedPhysicalProgress(
  projects: readonly MetricProject[],
): number | null {
  let weightedSum = 0;
  let weightTotal = 0;

  for (const project of projects) {
    if (project.physicalProgress === null || project.budgetTotal === null) {
      continue;
    }

    const weight = Math.abs(project.budgetTotal);
    if (weight === 0) {
      continue;
    }

    weightedSum += project.physicalProgress * weight;
    weightTotal += weight;
  }

  if (weightTotal === 0) {
    return null;
  }

  return Math.round(weightedSum / weightTotal);
}

/** Resultado del cálculo de ejecución presupuestaria. */
export type BudgetExecution = {
  /** Monto ejecutado, o `null` si no hay dato. */
  executed: number | null;
  /** Monto total, o `null` si no hay dato. */
  total: number | null;
  /** Porcentaje ejecutado redondeado (0–100), o `null` si el total es 0 o falta. */
  pct: number | null;
};

/**
 * Calcula la ejecución presupuestaria y su porcentaje.
 *
 * Guardia de división por cero: si `budgetTotal` es `null` o `0`, el porcentaje
 * es `null` (nunca `Infinity`/`NaN`). Los montos se devuelven tal cual para que
 * la UI pueda mostrarlos aunque el porcentaje no sea calculable.
 *
 * @param budgetExecutedTotal - Suma de presupuesto ejecutado, o `null`.
 * @param budgetTotal - Suma de presupuesto total de proyectos activos, o `null`.
 * @returns Objeto `{ executed, total, pct }` con valores posiblemente `null`.
 * @complexity O(1) — operaciones aritméticas constantes.
 */
export function budgetExecution(
  budgetExecutedTotal: number | null,
  budgetTotal: number | null,
): BudgetExecution {
  if (budgetExecutedTotal === null || budgetTotal === null || budgetTotal === 0) {
    return { executed: budgetExecutedTotal, total: budgetTotal, pct: null };
  }

  return {
    executed: budgetExecutedTotal,
    total: budgetTotal,
    pct: Math.round((budgetExecutedTotal / budgetTotal) * 100),
  };
}

/** Conteo de proyectos agrupados por una clave de texto. */
export type StatusCount = {
  /** Etiqueta del grupo (estatus o prioridad). */
  label: string;
  /** Número de proyectos en el grupo. */
  count: number;
  /** Porcentaje redondeado sobre el total (0–100). */
  pct: number;
};

/**
 * Conteo de proyectos por prioridad.
 *
 * Alias semántico de {@link StatusCount}: la forma es idéntica, pero el nombre
 * distingue ambas listas en el contrato del repositorio (§7 de la spec).
 */
export type PriorityCount = StatusCount;

/**
 * Cuenta proyectos por estatus y calcula el porcentaje de cada grupo.
 *
 * El orden de los grupos es el de **primera aparición** en la lista de entrada,
 * lo que permite al adapter fijar un orden estable. Los grupos sin ocurrencias
 * no se emiten (la UI decide si muestra los estatus canónicos con conteo cero).
 *
 * @param projects - Proyectos a agrupar.
 * @returns Lista de `{ label, count, pct }` por estatus.
 * @complexity O(n) — una pasada con un `Map` de acumulación.
 */
export function countByStatus(
  projects: readonly MetricProject[],
): StatusCount[] {
  return countByKey(projects, (project) => project.status);
}

/**
 * Cuenta proyectos por prioridad y calcula el porcentaje de cada grupo.
 *
 * Mismo criterio de orden (primera aparición) y de porcentaje que
 * {@link countByStatus}.
 *
 * @param projects - Proyectos a agrupar.
 * @returns Lista de `{ label, count, pct }` por prioridad.
 * @complexity O(n) — una pasada con un `Map` de acumulación.
 */
export function countByPriority(
  projects: readonly MetricProject[],
): StatusCount[] {
  return countByKey(projects, (project) => project.priority);
}

/**
 * Agrupa proyectos por una clave derivada y calcula conteos y porcentajes.
 *
 * Implementación compartida por {@link countByStatus} y {@link countByPriority}.
 * Usa `Map` para preservar el orden de inserción y mantener el coste lineal
 * frente a una búsqueda repetida dentro de un array (que sería O(n²)).
 *
 * @param projects - Proyectos a agrupar.
 * @param keyOf - Selector de la clave de agrupación.
 * @returns Lista de `{ label, count, pct }` en orden de primera aparición.
 * @complexity O(n) — una pasada sobre los proyectos y la posterior sobre los grupos.
 */
function countByKey(
  projects: readonly MetricProject[],
  keyOf: (project: MetricProject) => string,
): StatusCount[] {
  const counts = new Map<string, number>();

  for (const project of projects) {
    const key = keyOf(project);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = projects.length;

  return Array.from(counts, ([label, count]) => ({
    label,
    count,
    pct: total === 0 ? 0 : Math.round((count / total) * 100),
  }));
}

/** Elemento filtrable por fecha, mínimo para {@link filterByPeriod}. */
export type PeriodFilterable = {
  /** Fecha ISO 8601 del elemento (con o sin hora). */
  date: string;
};

/** Número de días naturales que abarca cada período, medido hacia atrás. */
const PERIOD_DAYS: Record<DashboardPeriod, number> = {
  hoy: 0,
  semana: 6,
  mes: 29,
  trimestre: 89,
};

/**
 * Devuelve el límite inferior (inclusive) del período relativo a `now`.
 *
 * `"hoy"` se limita al mismo día natural; `"semana"`, `"mes"` y `"trimestre"`
 * cuentan días naturales hacia atrás (6, 29 y 89 respectivamente), de modo que
 * `"semana"` incluye hoy más los seis días previos.
 *
 * @param period - Período a evaluar.
 * @param now - Instante de referencia inyectado (determinismo).
 * @returns La fecha límite inferior, a las 00:00 locales.
 * @complexity O(1) — aritmética de fechas constante.
 */
function periodStart(period: DashboardPeriod, now: Date): Date {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - PERIOD_DAYS[period]);
  return start;
}

/**
 * Filtra elementos por período temporal, usando `now` como referencia.
 *
 * Un elemento entra si su fecha cae en `[periodStart, now]` (ambos inclusive).
 * Las fechas futuras a `now` se descartan; las inválidas también. `now` se
 * inyecta para que el resultado sea determinista y testeable.
 *
 * @param items - Elementos con una propiedad `date` en ISO 8601.
 * @param period - Período del selector (`hoy` | `semana` | `mes` | `trimestre`).
 * @param now - Instante de referencia inyectado.
 * @returns Los elementos dentro del período, conservando su orden original.
 * @complexity O(n) — una pasada sobre los elementos.
 */
export function filterByPeriod<T extends PeriodFilterable>(
  items: readonly T[],
  period: DashboardPeriod,
  now: Date,
): T[] {
  const start = periodStart(period, now);

  return items.filter((item) => {
    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return date >= start && date <= now;
  });
}

/**
 * Cuenta los proyectos activos (todos los que no están finalizados).
 *
 * Criterio: un proyecto "activo" es el que aún requiere gestión, es decir,
 * cualquiera cuyo estatus no sea `Finalizado`. Devuelve `null` cuando no hay
 * proyectos, para distinguir "sin datos" de "cero activos" en la UI.
 *
 * @param projects - Proyectos a evaluar.
 * @returns Número de proyectos activos, o `null` si la lista está vacía.
 * @complexity O(n) — una pasada sobre los proyectos.
 */
export function activeProjects(
  projects: readonly MetricProject[],
): number | null {
  if (projects.length === 0) {
    return null;
  }

  return projects.filter((project) => project.status !== "Finalizado").length;
}

/**
 * Cuenta los proyectos en ejecución (`status === "En ejecución"`).
 *
 * Devuelve `null` cuando no hay proyectos, por la misma razón que
 * {@link activeProjects}.
 *
 * @param projects - Proyectos a evaluar.
 * @returns Número de proyectos en ejecución, o `null` si la lista está vacía.
 * @complexity O(n) — una pasada sobre los proyectos.
 */
export function inProgressProjects(
  projects: readonly MetricProject[],
): number | null {
  if (projects.length === 0) {
    return null;
  }

  return projects.filter((project) => project.status === "En ejecución").length;
}

/**
 * Suma una métrica numérica de los proyectos, ignorando los valores `null`.
 *
 * Si todos los valores son `null` devuelve `null` (no `0`), para no inventar un
 * dato inexistente.
 *
 * @param projects - Proyectos a sumar.
 * @param valueOf - Selector del valor numérico a acumular.
 * @returns La suma redondeada a dos decimales, o `null` si no hay valores.
 * @complexity O(n) — una pasada sobre los proyectos.
 */
export function sumMetric(
  projects: readonly MetricProject[],
  valueOf: (project: MetricProject) => number | null,
): number | null {
  let total = 0;
  let hasValue = false;

  for (const project of projects) {
    const value = valueOf(project);
    if (value === null) {
      continue;
    }
    total += value;
    hasValue = true;
  }

  if (!hasValue) {
    return null;
  }

  return Math.round(total * 100) / 100;
}
