import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard, KPI_EMPTY_VALUE } from "./kpi-card";

/**
 * Tests de `KpiCard`: valor `—` sin dato, acento danger en alertas y mini-barra
 * con `role="progressbar"`.
 */
describe("KpiCard", () => {
  it("renderiza etiqueta y valor", () => {
    render(<KpiCard label="Proyectos activos" value="12" icon={<svg />} />);
    expect(screen.getByText("Proyectos activos")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("muestra un em dash cuando el valor es null", () => {
    render(<KpiCard label="Presupuesto" value={null} icon={<svg />} />);
    expect(screen.getByText(KPI_EMPTY_VALUE)).toBeInTheDocument();
  });

  it("renderiza el detalle secundario cuando existe", () => {
    render(
      <KpiCard
        label="Presupuesto ejecutado"
        value="68%"
        icon={<svg />}
        detail="$45.000 / $66.000"
      />,
    );
    expect(screen.getByText("$45.000 / $66.000")).toBeInTheDocument();
  });

  it("pinta el valor en text-danger cuando danger es true y hay valor", () => {
    render(
      <KpiCard label="Alertas de stock" value="2" icon={<svg />} danger />,
    );
    expect(screen.getByText("2")).toHaveClass("text-danger");
  });

  it("no pinta danger cuando el valor es cero", () => {
    render(
      <KpiCard label="Alertas de stock" value="0" icon={<svg />} danger />,
    );
    expect(screen.getByText("0")).not.toHaveClass("text-danger");
  });

  it("no pinta danger cuando el valor es null", () => {
    render(
      <KpiCard label="Alertas de stock" value={null} icon={<svg />} danger />,
    );
    expect(screen.getByText(KPI_EMPTY_VALUE)).not.toHaveClass("text-danger");
  });

  it("renderiza una mini-barra accesible cuando recibe progressPct", () => {
    render(
      <KpiCard
        label="Avance físico global"
        value="74%"
        icon={<svg />}
        progressPct={74}
      />,
    );

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "74");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-label", "Avance físico global: 74%");
  });

  it("no renderiza mini-barra cuando progressPct es null", () => {
    render(
      <KpiCard label="Avance" value="—" icon={<svg />} progressPct={null} />,
    );
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
