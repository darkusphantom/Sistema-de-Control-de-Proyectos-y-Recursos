import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Props aceptadas por {@link KpiCard}. */
export type KpiCardProps = {
  /** Etiqueta descriptiva del indicador (texto siempre visible). */
  label: string;
  /** Valor principal ya formateado, o `null` para mostrar `—`. */
  value: string | null;
  /** Ícono decorativo (debe ser `aria-hidden`); se pinta en el acento sutil. */
  icon: ReactNode;
  /** Detalle secundario opcional bajo la etiqueta (p. ej. `$ ejecutado / $ total`). */
  detail?: string;
  /** Cuando es `true`, el valor se pinta en `--danger` (KPI de alertas > 0). */
  danger?: boolean;
  /**
   * Porcentaje (0–100) para una mini-barra de progreso bajo el valor; `null`
   * cuando el KPI no admite barra.
   */
  progressPct?: number | null;
};

/** Valor mostrado cuando el indicador no tiene dato (em dash). */
export const KPI_EMPTY_VALUE = "—";

/**
 * Tarjeta de un indicador clave (KPI) del dashboard.
 *
 * Diseño (`docs/design/wireframes_dashboard.md` §5.2):
 * - Card blanca con borde redondeado y padding generoso.
 * - Ícono sutil en `text-accent` (D2: acento ámbar actual) y `aria-hidden`.
 * - Valor en `tabular-nums` para que el layout no salte al cambiar de período.
 * - Sin dato se muestra `—`, nunca `NaN` ni un `0` inventado.
 * - El KPI de alertas críticas usa `--danger` cuando su valor es mayor que 0.
 *
 * @param props - Props del KPI.
 * @returns La tarjeta del indicador.
 */
export function KpiCard({
  label,
  value,
  icon,
  detail,
  danger = false,
  progressPct = null,
}: KpiCardProps) {
  const displayValue = value ?? KPI_EMPTY_VALUE;
  const isDanger =
    danger && value !== null && value !== KPI_EMPTY_VALUE && value !== "0";

  return (
    // @complexity O(1) — render de una card sin bucles.
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-5">
      <span className="text-accent" aria-hidden="true">
        {icon}
      </span>

      <span
        className={cn(
          "text-h1 font-semibold tabular-nums",
          isDanger ? "text-danger" : "text-text",
        )}
      >
        {displayValue}
      </span>

      {progressPct !== null && (
        <span
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${progressPct}%`}
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
        >
          <span
            className="block h-full rounded-full bg-accent"
            style={{ width: `${Math.min(Math.max(progressPct, 0), 100)}%` }}
          />
        </span>
      )}

      <span className="text-sm text-text-muted">{label}</span>

      {detail && <span className="text-xs text-text-muted tabular-nums">{detail}</span>}
    </div>
  );
}
