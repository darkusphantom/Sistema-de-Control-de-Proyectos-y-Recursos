import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardView } from "./dashboard-view";
import type {
  DashboardPeriod,
  DashboardSnapshot,
} from "@/lib/repositories/dashboard-repository";

/** Construye un snapshot mínimo con un número de proyectos activos dado. */
function snapshot(activeProjects: number): DashboardSnapshot {
  return {
    kpis: {
      activeProjects,
      inProgressProjects: activeProjects,
      budgetExecuted: 100,
      budgetTotal: 200,
      budgetExecutedPct: 50,
      physicalProgressPct: 50,
      criticalStockAlerts: 0,
    },
    alerts: [],
    projectProgress: [],
    distribution: { byStatus: [], byPriority: [] },
    activity: [],
  };
}

const snapshots: Record<DashboardPeriod, DashboardSnapshot> = {
  hoy: snapshot(3),
  semana: snapshot(6),
  mes: snapshot(12),
  trimestre: snapshot(24),
};

/**
 * Tests de `DashboardView`: gestiona el período con estado local y el snapshot
 * por defecto es "mes".
 */
describe("DashboardView", () => {
  it("usa 'mes' como período por defecto", () => {
    render(<DashboardView snapshots={snapshots} nowIso="2026-10-20T10:42:00Z" />);
    expect(screen.getByRole("combobox", { name: "Período" })).toHaveValue("mes");
    expect(screen.getAllByText("12").length).toBeGreaterThan(0);
  });

  it("intercambia el snapshot al cambiar de período", async () => {
    const user = userEvent.setup();
    render(<DashboardView snapshots={snapshots} nowIso="2026-10-20T10:42:00Z" />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Período" }),
      "hoy",
    );

    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
  });

  it("no renderiza el panel de alertas cuando el snapshot no tiene alertas", () => {
    render(<DashboardView snapshots={snapshots} nowIso="2026-10-20T10:42:00Z" />);
    expect(
      screen.queryByRole("heading", { level: 2, name: /Alertas críticas/i }),
    ).toBeNull();
  });
});
