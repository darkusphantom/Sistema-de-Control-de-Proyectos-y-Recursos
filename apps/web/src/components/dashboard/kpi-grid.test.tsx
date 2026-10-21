import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiGrid } from "./kpi-grid";
import type { DashboardKpis } from "@/lib/repositories/dashboard-repository";

/** KPIs de ejemplo con datos completos. */
const fullKpis: DashboardKpis = {
  activeProjects: 12,
  inProgressProjects: 5,
  budgetExecuted: 45_000,
  budgetTotal: 66_000,
  budgetExecutedPct: 68,
  physicalProgressPct: 74,
  criticalStockAlerts: 2,
};

/** KPIs sin ningún dato (estado vacío de la fuente). */
const emptyKpis: DashboardKpis = {
  activeProjects: null,
  inProgressProjects: null,
  budgetExecuted: null,
  budgetTotal: null,
  budgetExecutedPct: null,
  physicalProgressPct: null,
  criticalStockAlerts: null,
};

/**
 * Tests de `KpiGrid`: las cinco cards de la especificación §5.2, el formato de
 * montos y el comportamiento sin datos.
 */
describe("KpiGrid", () => {
  it("renderiza las cinco etiquetas de KPI", () => {
    render(<KpiGrid kpis={fullKpis} />);

    expect(screen.getByText("Proyectos activos")).toBeInTheDocument();
    expect(screen.getByText("Proyectos en ejecución")).toBeInTheDocument();
    expect(screen.getByText("Presupuesto ejecutado")).toBeInTheDocument();
    expect(screen.getByText("Avance físico global")).toBeInTheDocument();
    expect(screen.getByText("Alertas de stock")).toBeInTheDocument();
  });

  it("formatea el presupuesto como porcentaje con detalle de montos", () => {
    render(<KpiGrid kpis={fullKpis} />);
    expect(screen.getByText("68%")).toBeInTheDocument();
    expect(screen.getByText("$45.000 / $66.000")).toBeInTheDocument();
  });

  it("pinta el KPI de alertas en danger cuando es mayor que 0", () => {
    render(<KpiGrid kpis={fullKpis} />);
    expect(screen.getByText("2")).toHaveClass("text-danger");
  });

  it("muestra em dashes cuando faltan datos", () => {
    render(<KpiGrid kpis={emptyKpis} />);
    // 5 KPIs + barra sin dato no aplica → al menos 5 valores `—`.
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(5);
  });

  it("renderiza la mini-barra de avance con su valor", () => {
    render(<KpiGrid kpis={fullKpis} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "74");
  });

  it("no renderiza mini-barra cuando el avance es null", () => {
    render(<KpiGrid kpis={emptyKpis} />);
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
