import {
  activeProjects,
  budgetExecution,
  countByPriority,
  countByStatus,
  filterByPeriod,
  inProgressProjects,
  sumMetric,
  weightedPhysicalProgress,
  type MetricProject,
} from "@/lib/dashboard/metrics";
import type {
  ActivityItem,
  DashboardAlert,
  DashboardPeriod,
  DashboardRepository,
  DashboardSnapshot,
  ProjectProgressRow,
} from "./dashboard-repository";

/**
 * Proyecto del fixture, incluyendo los datos que necesitan las métricas y las
 * cadenas que consume el repositorio.
 */
type SeedProject = MetricProject & {
  code: string;
  name: string;
};

/**
 * Convierte un desfase en horas (negativo = pasado) a una fecha ISO 8601
 * relativa a `now`. Centraliza la construcción de fechas para que el fixture
 * dependa de un único punto de referencia y el filtrado por período sea
 * determinista bajo el `now` real de la petición.
 *
 * @param now - Instante de referencia.
 * @param hoursAgo - Horas de desplazamiento hacia el pasado (positivo) o futuro (negativo).
 * @returns Fecha ISO 8601 calculada.
 * @complexity O(1) — aritmética de fechas constante.
 */
function hoursBefore(now: Date, hoursAgo: number): string {
  return new Date(now.getTime() - hoursAgo * 3_600_000).toISOString();
}

/**
 * Proyectos semilla del fixture.
 *
 * Los presupuestos y avances son valores realistas y **coherentes**: el avance
 * global no se escribe a mano, se deriva de estas filas con
 * {@link weightedPhysicalProgress}; la ejecución presupuestaria nunca supera el
 * total. Los 12 proyectos se distribuyen entre los 4 estatus y las 4
 * prioridades de la especificación.
 */
const SEED_PROJECTS: SeedProject[] = [
  { code: "PRY-001", name: "Análisis de aguas residuales", status: "En ejecución", priority: "Crítica", physicalProgress: 80, budgetTotal: 12_000, budgetExecuted: 9_600 },
  { code: "PRY-002", name: "Síntesis de catalizadores", status: "En ejecución", priority: "Alta", physicalProgress: 45, budgetTotal: 8_000, budgetExecuted: 3_600 },
  { code: "PRY-003", name: "Control de calidad de reactivos", status: "En ejecución", priority: "Alta", physicalProgress: 62, budgetTotal: 6_500, budgetExecuted: 4_030 },
  { code: "PRY-004", name: "Monitoreo de contaminantes atmosféricos", status: "En ejecución", priority: "Media", physicalProgress: 30, budgetTotal: 10_000, budgetExecuted: 3_000 },
  { code: "PRY-005", name: "Validación de métodos analíticos", status: "En ejecución", priority: "Media", physicalProgress: 95, budgetTotal: 5_500, budgetExecuted: 5_225 },
  { code: "PRY-006", name: "Estudio de suelos salinos", status: "Propuesta", priority: "Crítica", physicalProgress: 0, budgetTotal: 9_000, budgetExecuted: 0 },
  { code: "PRY-007", name: "Optimización de bioprocesos", status: "Propuesta", priority: "Media", physicalProgress: 5, budgetTotal: 7_000, budgetExecuted: 350 },
  { code: "PRY-008", name: "Caracterización de polímeros", status: "Propuesta", priority: "Baja", physicalProgress: 10, budgetTotal: 4_000, budgetExecuted: 400 },
  { code: "PRY-009", name: "Recuperación de metales pesados", status: "Suspendido", priority: "Alta", physicalProgress: 52, budgetTotal: 6_000, budgetExecuted: 3_120 },
  { code: "PRY-010", name: "Análisis espectroscópico de pigmentos", status: "Suspendido", priority: "Baja", physicalProgress: 20, budgetTotal: 3_500, budgetExecuted: 700 },
  { code: "PRY-011", name: "Ensayo de toxicidad en efluentes", status: "Finalizado", priority: "Baja", physicalProgress: 100, budgetTotal: 5_000, budgetExecuted: 5_000 },
  { code: "PRY-012", name: "Síntesis de fungicidas agrícolas", status: "Finalizado", priority: "Media", physicalProgress: 100, budgetTotal: 4_500, budgetExecuted: 4_500 },
];

/** Configuración de las alertas críticas semilla (sin fecha; se resuelve por período). */
type SeedAlert = Omit<DashboardAlert, "date"> & {
  /** Desfase en horas respecto a `now` (positivo = pasado). */
  hoursAgo: number;
};

/** Alertas críticas semilla, ordenadas por severidad descendente. */
const SEED_ALERTS: SeedAlert[] = [
  { id: "alert-1", type: "approval", description: "3 solicitudes pendientes de aprobación", hoursAgo: 2 },
  { id: "alert-2", type: "stock", description: "Reactivo H₂SO₄ bajo mínimo (2 L disponibles)", hoursAgo: 5 },
  { id: "alert-3", type: "maintenance", description: "Equipo EQ-014 en mantenimiento programado", hoursAgo: 26 },
  { id: "alert-4", type: "reservation", description: "Reserva del espectrofotómetro vence mañana", hoursAgo: 30 },
  { id: "alert-5", type: "stock", description: "Reactivo KMnO₄ sin stock", hoursAgo: 120 },
  { id: "alert-6", type: "approval", description: "Solicitud SG-009 pendiente de aprobación", hoursAgo: 200 },
  { id: "alert-7", type: "maintenance", description: "Balanza analítica fuera de servicio", hoursAgo: 900 },
];

/** Configuración de los ítems de actividad semilla (sin fecha; se resuelve por período). */
type SeedActivity = Omit<ActivityItem, "date"> & {
  /** Desfase en horas respecto a `now` (positivo = pasado). */
  hoursAgo: number;
};

/** Actividad reciente semilla, ordenada de más reciente a más antigua. */
const SEED_ACTIVITY: SeedActivity[] = [
  { id: "act-1", type: "dispatch", description: "Despacho DSP-014 — Reactivo H₂SO₄ (12 L) al PRY-001", hoursAgo: 1 },
  { id: "act-2", type: "priority_change", description: "PRY-002 cambió de prioridad: Media → Alta", hoursAgo: 3 },
  { id: "act-3", type: "expense_request", description: "Solicitud SG-007 de $450 pendiente de aprobación", hoursAgo: 6 },
  { id: "act-4", type: "dispatch", description: "Despacho DSP-013 — Guantes de nitrilo (50 u.) al PRY-003", hoursAgo: 20 },
  { id: "act-5", type: "priority_change", description: "PRY-006 cambió de prioridad: Alta → Crítica", hoursAgo: 48 },
  { id: "act-6", type: "expense_request", description: "Solicitud SG-006 de $1.200 aprobada", hoursAgo: 96 },
  { id: "act-7", type: "dispatch", description: "Despacho DSP-012 — Metanol (8 L) al PRY-005", hoursAgo: 500 },
  { id: "act-8", type: "priority_change", description: "PRY-009 cambió de prioridad: Media → Alta", hoursAgo: 1_200 },
];

/**
 * Implementación estática de {@link DashboardRepository}.
 *
 * Genera el snapshot en memoria a partir de los fixtures de arriba y de las
 * funciones puras de `lib/dashboard/metrics`. El avance global ponderado, la
 * ejecución presupuestaria y las distribuciones **se derivan** de los
 * proyectos, de modo que los datos son internamente coherentes.
 *
 * Limitación conocida (documentada como deuda del MVP): el filtrado por período
 * se aplica a alertas y actividad (que tienen fecha), pero los KPIs de
 * proyectos se calculan sobre el conjunto completo de proyectos porque el
 * fixture no modela fechas de proyecto. La Fase 5 (datos reales) resolverá este
 * filtrado con las fechas de `Project`.
 */
export class StaticDashboardRepository implements DashboardRepository {
  /**
   * Construye el snapshot de indicadores para el período solicitado.
   *
   * @param period - Período del selector (Hoy/Semana/Mes/Trimestre).
   * @returns El snapshot filtrado y ordenado.
   * @complexity O(n + a + i) — n proyectos, a alertas e i ítems de actividad.
   */
  async getSnapshot(period: DashboardPeriod): Promise<DashboardSnapshot> {
    const now = new Date();

    const alerts = filterByPeriod(
      SEED_ALERTS.map((alert) => ({
        id: alert.id,
        type: alert.type,
        description: alert.description,
        date: hoursBefore(now, alert.hoursAgo),
      })),
      period,
      now,
    );

    const activity = filterByPeriod(
      SEED_ACTIVITY.map((item) => ({
        id: item.id,
        type: item.type,
        description: item.description,
        date: hoursBefore(now, item.hoursAgo),
      })),
      period,
      now,
    ).sort((a, b) => b.date.localeCompare(a.date));

    const budgetExecuted =
      sumMetric(SEED_PROJECTS, (project) => project.budgetExecuted) ?? null;
    const budgetTotal =
      sumMetric(SEED_PROJECTS, (project) => project.budgetTotal) ?? null;
    const { pct: budgetExecutedPct } = budgetExecution(
      budgetExecuted,
      budgetTotal,
    );

    const projectProgress: ProjectProgressRow[] = SEED_PROJECTS.map(
      (project) => ({
        code: project.code,
        name: project.name,
        progress: project.physicalProgress,
      }),
    ).sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));

    // Las alertas de stock del fixture que caen en el período alimentan el KPI 5.
    const criticalStockAlerts = filterByPeriod(
      SEED_ALERTS.filter((alert) => alert.type === "stock").map((alert) => ({
        date: hoursBefore(now, alert.hoursAgo),
      })),
      period,
      now,
    ).length;

    return {
      kpis: {
        activeProjects: activeProjects(SEED_PROJECTS),
        inProgressProjects: inProgressProjects(SEED_PROJECTS),
        budgetExecuted,
        budgetTotal,
        budgetExecutedPct,
        physicalProgressPct: weightedPhysicalProgress(SEED_PROJECTS),
        criticalStockAlerts,
      },
      alerts,
      projectProgress,
      distribution: {
        byStatus: countByStatus(SEED_PROJECTS),
        byPriority: countByPriority(SEED_PROJECTS),
      },
      activity,
    };
  }
}
