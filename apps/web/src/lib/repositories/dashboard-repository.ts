/**
 * Contrato hexagonal del dashboard ejecutivo (`/dashboard`).
 *
 * Define los tipos del snapshot y el puerto `DashboardRepository`. Las vistas
 * consumen esta interfaz; cambiar del adapter estático al de PostgreSQL/API no
 * debe requerir cambios en los consumidores (patrón repositorio de
 * `docs/architecture/frontend-structure.md` §6).
 *
 * Especificación: `docs/design/wireframes_dashboard.md` §7.
 *
 * @module lib/repositories/dashboard-repository
 */

/**
 * Re-exporta los tipos de conteo definidos en `lib/dashboard/metrics` para que
 * el contrato del repositorio sea autocontenido y los consumidores importen
 * tipos desde un único módulo cuando trabajan con snapshots.
 */
export type { PriorityCount, StatusCount } from "@/lib/dashboard/metrics";
import type { PriorityCount, StatusCount } from "@/lib/dashboard/metrics";

/**
 * Período del selector del dashboard (D3 de la especificación).
 *
 * - `hoy`: día natural actual.
 * - `semana`: hoy más los 6 días previos.
 * - `mes`: hoy más los 29 días previos.
 * - `trimestre`: hoy más los 89 días previos.
 */
export type DashboardPeriod = "hoy" | "semana" | "mes" | "trimestre";

/** Etiquetas en español de cada período, para el selector de la cabecera. */
export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriod, string> = {
  hoy: "Hoy",
  semana: "Semana",
  mes: "Mes",
  trimestre: "Trimestre",
};

/** Período mostrado por defecto al entrar al dashboard (`Mes`). */
export const DEFAULT_DASHBOARD_PERIOD: DashboardPeriod = "mes";

/** Tipo de alerta crítica mostrada en el panel de alertas. */
export type DashboardAlertType =
  | "stock"
  | "maintenance"
  | "reservation"
  | "approval";

/** Alerta crítica mostrada en la primera card del cuerpo. */
export type DashboardAlert = {
  /** Identificador estable de la alerta. */
  id: string;
  /** Categoría de la alerta; determina el badge y el ícono. */
  type: DashboardAlertType;
  /** Descripción corta en español, ya legible para el usuario. */
  description: string;
  /** Fecha ISO 8601 de detección; usada por el filtro de período. */
  date: string;
};

/** Fila de avance físico de un proyecto (sección "Avance por proyecto"). */
export type ProjectProgressRow = {
  /** Código único del proyecto (p. ej. `PRY-001`). */
  code: string;
  /** Nombre legible del proyecto. */
  name: string;
  /** Porcentaje de avance físico (0–100), o `null` si no hay dato. */
  progress: number | null;
};

/** Tipos de ítem de la actividad reciente. */
export type ActivityItemType = "dispatch" | "priority_change" | "expense_request";

/** Ítem de la actividad reciente (sección "Actividad reciente"). */
export type ActivityItem = {
  /** Identificador estable del ítem. */
  id: string;
  /** Tipo de evento; determina el ícono de la fila. */
  type: ActivityItemType;
  /** Texto descriptivo en español. */
  description: string;
  /** Fecha ISO 8601 del evento; usada por el filtro de período. */
  date: string;
};

/** Indicadores clave del dashboard (5 KPIs de la especificación §5.2). */
export type DashboardKpis = {
  /** Número de proyectos activos (no finalizados), o `null` sin datos. */
  activeProjects: number | null;
  /** Número de proyectos en ejecución, o `null` sin datos. */
  inProgressProjects: number | null;
  /** Presupuesto ejecutado del período, o `null` sin datos. */
  budgetExecuted: number | null;
  /** Presupuesto total de proyectos activos, o `null` sin datos. */
  budgetTotal: number | null;
  /** Porcentaje de presupuesto ejecutado (0–100), o `null` sin datos. */
  budgetExecutedPct: number | null;
  /** Porcentaje de avance físico global ponderado (0–100), o `null`. */
  physicalProgressPct: number | null;
  /** Número de alertas de stock críticas, o `null` sin datos. */
  criticalStockAlerts: number | null;
};

/** Snapshot completo del dashboard para un período dado. */
export type DashboardSnapshot = {
  /** Indicadores clave ya filtrados por período. */
  kpis: DashboardKpis;
  /** Alertas críticas ya filtradas por período. */
  alerts: DashboardAlert[];
  /** Filas de avance por proyecto (la UI limita a 6). */
  projectProgress: ProjectProgressRow[];
  /** Distribución de proyectos por estatus y prioridad. */
  distribution: {
    byStatus: StatusCount[];
    byPriority: PriorityCount[];
  };
  /** Actividad reciente ya filtrada y ordenada descendente. */
  activity: ActivityItem[];
};

/**
 * Puerto hexagonal para la lectura de indicadores del dashboard.
 *
 * Implementaciones:
 * - `dashboard-repository.static.ts` — fixtures en memoria (fase estática).
 * - Futuro: adapter PostgreSQL/Supabase (misma interfaz, sin cambios en consumidores).
 */
export interface DashboardRepository {
  /**
   * Devuelve el snapshot de indicadores para un período dado.
   *
   * @param period - Período del selector (Hoy/Semana/Mes/Trimestre).
   * @returns El snapshot ya filtrado por el período solicitado.
   */
  getSnapshot(period: DashboardPeriod): Promise<DashboardSnapshot>;
}
