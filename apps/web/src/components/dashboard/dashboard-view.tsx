"use client";

import { useState } from "react";
import { DashboardHeader } from "./dashboard-header";
import { KpiGrid } from "./kpi-grid";
import { AlertsPanel } from "./alerts-panel";
import { ProjectProgress } from "./project-progress";
import { ProjectDistribution } from "./project-distribution";
import { ActivityFeed } from "./activity-feed";
import { QuickActions } from "./quick-actions";
import {
  DEFAULT_DASHBOARD_PERIOD,
  type DashboardPeriod,
  type DashboardSnapshot,
} from "@/lib/repositories/dashboard-repository";

/** Props aceptadas por {@link DashboardView}. */
export type DashboardViewProps = {
  /** Snapshots por período, resueltos en el servidor y serializados al cliente. */
  snapshots: Record<DashboardPeriod, DashboardSnapshot>;
  /** Instante de referencia ISO 8601, calculado en el servidor (determinista). */
  nowIso: string;
};

/**
 * Vista dinámica del dashboard ejecutivo.
 *
 * Client Component que concentra el único estado interactivo de la pantalla: el
 * **período seleccionado**. El snapshot de cada período llega ya resuelto desde
 * el servidor (evita un `fetch` en el cliente y mantiene el primer render
 * estático); cambiar de período solo intercambia el snapshot en memoria con
 * `useMemo`, sin volver a renderizar la página completa (§7 de la spec).
 *
 * @param props - Props de la vista.
 * @returns El dashboard completo con su estado de período.
 */
export function DashboardView({ snapshots, nowIso }: DashboardViewProps) {
  const [period, setPeriod] = useState<DashboardPeriod>(
    DEFAULT_DASHBOARD_PERIOD,
  );

  const referenceDate = new Date(nowIso);
  const snapshot = snapshots[period];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 py-4">
      <DashboardHeader
        referenceDate={referenceDate}
        period={period}
        onPeriodChange={setPeriod}
      />

      <AlertsPanel alerts={snapshot.alerts} />

      <KpiGrid kpis={snapshot.kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProjectProgress rows={snapshot.projectProgress} />
        <div className="flex flex-col gap-6">
          <ProjectDistribution
            byStatus={snapshot.distribution.byStatus}
            byPriority={snapshot.distribution.byPriority}
          />
          <ActivityFeed items={snapshot.activity} now={referenceDate} />
        </div>
      </div>

      <QuickActions />
    </div>
  );
}
