import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  AlertTriangleIcon,
  CalendarIcon,
  CubeIcon,
  ShieldIcon,
  WrenchIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type {
  DashboardAlert,
  DashboardAlertType,
} from "@/lib/repositories/dashboard-repository";

/** Máximo de filas de alerta visibles antes de "Ver todas". */
export const MAX_VISIBLE_ALERTS = 5;

/** Etiqueta, tono e ícono de cada tipo de alerta (§5.1). */
const ALERT_PRESENTATION: Record<
  DashboardAlertType,
  { label: string; tone: BadgeTone; icon: ReactNode }
> = {
  stock: { label: "Stock", tone: "warning", icon: <CubeIcon className="size-4" /> },
  maintenance: {
    label: "Mantenimiento",
    tone: "neutral",
    icon: <WrenchIcon className="size-4" />,
  },
  reservation: {
    label: "Reserva",
    tone: "warning",
    icon: <CalendarIcon className="size-4" />,
  },
  approval: {
    label: "Aprobación",
    tone: "danger",
    icon: <ShieldIcon className="size-4" />,
  },
};

/** Props aceptadas por {@link AlertsPanel}. */
export type AlertsPanelProps = {
  /** Alertas ya filtradas por período. */
  alerts: DashboardAlert[];
};

/**
 * Panel de alertas críticas (primera card del cuerpo, §5.1).
 *
 * Reglas de la especificación:
 * - **Solo se renderiza si hay alertas**: si la lista está vacía devuelve `null`
 *   para no ocupar espacio (el estado vacío global cubre el dashboard sin datos).
 * - Cada fila es **no clicable** en esta fase porque las rutas de detalle aún no
 *   existen (deuda D1 registrada en `roadmap-pivot.md` §2.1); se usa un `div` con
 *   `cursor-default` en lugar de un `button` que no navegaría.
 * - Se muestran como máximo {@link MAX_VISIBLE_ALERTS} filas; el pie "Ver todas"
 *   queda deshabilitado con badge "Próximamente".
 *
 * @param props - Props del panel.
 * @returns El panel de alertas, o `null` cuando no hay alertas.
 */
export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return null;
  }

  const visibleAlerts = alerts.slice(0, MAX_VISIBLE_ALERTS);

  return (
    <section
      aria-labelledby="alerts-heading"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
    >
      <div className="flex items-center gap-2">
        <span className="text-warning" aria-hidden="true">
          <AlertTriangleIcon className="size-5" />
        </span>
        <h2 id="alerts-heading" className="font-display text-h3 text-text">
          Alertas críticas
        </h2>
        <Badge tone="danger">{alerts.length}</Badge>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {visibleAlerts.map((alert) => {
          const presentation = ALERT_PRESENTATION[alert.type];

          return (
            <li key={alert.id}>
              <div className="flex items-center gap-3 py-3 cursor-default">
                <span className="text-text-muted shrink-0" aria-hidden="true">
                  {presentation.icon}
                </span>
                <p className="min-w-0 flex-1 text-sm text-text">
                  {alert.description}
                </p>
                <Badge tone={presentation.tone}>{presentation.label}</Badge>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        disabled
        aria-disabled="true"
        className={cn(
          buttonStyles({ variant: "ghost", size: "sm" }),
          "self-start gap-2",
        )}
      >
        Ver todas
        <Badge tone="muted">Próximamente</Badge>
      </button>
    </section>
  );
}
