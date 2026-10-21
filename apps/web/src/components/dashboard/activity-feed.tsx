import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  ArrowRightIcon,
  SlidersIcon,
  TagIcon,
} from "@/components/ui/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/cn";
import type {
  ActivityItem,
  ActivityItemType,
} from "@/lib/repositories/dashboard-repository";

/** Máximo de ítems de actividad visibles antes de "Ver bitácora". */
export const MAX_VISIBLE_ACTIVITY = 6;

/** Ícono decorativo por tipo de ítem de actividad (§5.5). */
const ACTIVITY_ICONS: Record<ActivityItemType, ReactNode> = {
  dispatch: <ArrowRightIcon className="size-4" />,
  priority_change: <SlidersIcon className="size-4" />,
  expense_request: <TagIcon className="size-4" />,
};

/**
 * Formatea un instante como tiempo relativo en español ("hace 2 h", "hace 3 d").
 *
 * Granularidad: menos de una hora → `hace unos minutos`; menos de 24 horas →
 * `hace N h`; en adelante → `hace N d`. Las fechas futuras o inválidas devuelven
 * cadena vacía para no mostrar un tiempo sin sentido.
 *
 * @param isoDate - Fecha ISO 8601 del evento.
 * @param now - Instante de referencia inyectado (determinismo en tests).
 * @returns El texto relativo en español, o cadena vacía si no es representable.
 * @complexity O(1) — aritmética de fechas constante.
 */
export function formatRelativeTime(isoDate: string, now: Date): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) {
    return "";
  }

  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) {
    return "hace unos minutos";
  }

  if (hours < 24) {
    return `hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

/** Props aceptadas por {@link ActivityFeed}. */
export type ActivityFeedProps = {
  /** Ítems de actividad ya filtrados y ordenados descendentemente. */
  items: ActivityItem[];
  /** Instante de referencia para el cálculo del tiempo relativo. */
  now: Date;
};

/**
 * Sección "Actividad reciente" del dashboard (§5.5).
 *
 * - Lista `<ol>` con ícono + texto + `<time dateTime>` y texto relativo.
 * - Máximo {@link MAX_VISIBLE_ACTIVITY} ítems; el pie "Ver bitácora" queda
 *   deshabilitado con badge "Próximamente" (deuda D1).
 * - Sin actividad muestra un `EmptyState`.
 *
 * @param props - Props de la sección.
 * @returns La sección de actividad reciente.
 */
export function ActivityFeed({ items, now }: ActivityFeedProps) {
  const visibleItems = items.slice(0, MAX_VISIBLE_ACTIVITY);

  return (
    <section
      aria-labelledby="activity-feed-heading"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
    >
      <h2 id="activity-feed-heading" className="font-display text-h3 text-text">
        Actividad reciente
      </h2>

      {items.length === 0 ? (
        <EmptyState
          icon={<SlidersIcon className="size-10" />}
          title="No hay actividad reciente en este período"
          description="Los despachos, cambios de prioridad y solicitudes aparecerán aquí."
        />
      ) : (
        <>
          <ol className="flex flex-col divide-y divide-border">
            {visibleItems.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
                <span className="text-text-muted shrink-0 mt-0.5" aria-hidden="true">
                  {ACTIVITY_ICONS[item.type]}
                </span>
                <p className="min-w-0 flex-1 text-sm text-text">
                  {item.description}
                </p>
                <time
                  dateTime={item.date}
                  className="shrink-0 text-xs text-text-muted"
                >
                  {formatRelativeTime(item.date, now)}
                </time>
              </li>
            ))}
          </ol>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className={cn(
              buttonStyles({ variant: "ghost", size: "sm" }),
              "self-start gap-2",
            )}
          >
            Ver bitácora
            <Badge tone="muted">Próximamente</Badge>
          </button>
        </>
      )}
    </section>
  );
}
