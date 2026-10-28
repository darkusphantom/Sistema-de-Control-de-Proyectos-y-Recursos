import {
  AlertTriangleIcon,
  ArrowRightIcon,
  HomeIcon,
  SlidersIcon,
  TagIcon,
} from "@/components/ui/icons";
import { KpiCard } from "./kpi-card";
import type { DashboardKpis } from "@/lib/repositories/dashboard-repository";

/** Props aceptadas por {@link KpiGrid}. */
export type KpiGridProps = {
  /** Indicadores clave ya calculados para el período seleccionado. */
  kpis: DashboardKpis;
};

/**
 * Formatea un monto monetario sin decimales para la card de presupuesto.
 *
 * Usa `es-VE` (separador de miles `.`) porque el wireframe especifica el
 * formato `$45.000` (`docs/design/wireframes_dashboard.md` §5.2). El símbolo
 * `$` se antepone a mano al no declararse una divisa en el modelo; extraer un
 * `formatAmount` reutilizable queda como mejora futura.
 *
 * @param amount - Monto a formatear, o `null`.
 * @returns El monto formateado (p. ej. `$45.000`), o `null` si no hay dato.
 * @complexity O(1) — una única llamada a `Intl.NumberFormat`.
 */
function formatAmount(amount: number | null): string | null {
  if (amount === null) {
    return null;
  }

  return `$${new Intl.NumberFormat("es-VE", { maximumFractionDigits: 0 }).format(amount)}`;
}

/**
 * Rejilla de los 5 KPIs del dashboard.
 *
 * Mapeo de la especificación §5.2 (orden estable 1→5 en todas las pantallas):
 * 1. Proyectos activos — `HomeIcon`.
 * 2. Proyectos en ejecución — `ArrowRightIcon`.
 * 3. Presupuesto ejecutado vs. total — `TagIcon` (porcentaje + montos).
 * 4. Avance físico global — `SlidersIcon` (porcentaje + mini-barra).
 * 5. Alertas de stock críticas — `AlertTriangleIcon` (acento `--danger` si > 0).
 *
 * Rejilla responsive (§3.2): 2 columnas en móvil, 3 en tablet y 5 en desktop.
 *
 * @param props - Props de la rejilla.
 * @returns La rejilla con las cinco tarjetas de indicadores.
 */
export function KpiGrid({ kpis }: KpiGridProps) {
  const budgetExecuted = formatAmount(kpis.budgetExecuted);
  const budgetTotal = formatAmount(kpis.budgetTotal);

  const budgetValue = kpis.budgetExecutedPct === null ? null : `${kpis.budgetExecutedPct}%`;
  const budgetDetail =
    budgetExecuted === null || budgetTotal === null
      ? undefined
      : `${budgetExecuted} / ${budgetTotal}`;

  const progressValue =
    kpis.physicalProgressPct === null ? null : `${kpis.physicalProgressPct}%`;

  const alertsValue =
    kpis.criticalStockAlerts === null ? null : String(kpis.criticalStockAlerts);

  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      data-testid="kpi-grid"
    >
      <KpiCard
        label="Proyectos activos"
        value={kpis.activeProjects === null ? null : String(kpis.activeProjects)}
        icon={<HomeIcon className="size-5" />}
      />
      <KpiCard
        label="Proyectos en ejecución"
        value={
          kpis.inProgressProjects === null
            ? null
            : String(kpis.inProgressProjects)
        }
        icon={<ArrowRightIcon className="size-5" />}
      />
      <KpiCard
        label="Presupuesto ejecutado"
        value={budgetValue}
        detail={budgetDetail}
        icon={<TagIcon className="size-5" />}
      />
      <KpiCard
        label="Avance físico global"
        value={progressValue}
        icon={<SlidersIcon className="size-5" />}
        progressPct={kpis.physicalProgressPct}
      />
      <KpiCard
        label="Alertas de stock"
        value={alertsValue}
        icon={<AlertTriangleIcon className="size-5" />}
        danger={(kpis.criticalStockAlerts ?? 0) > 0}
      />
    </div>
  );
}
