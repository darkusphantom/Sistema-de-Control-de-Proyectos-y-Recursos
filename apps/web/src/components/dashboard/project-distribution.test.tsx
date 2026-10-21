import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ProjectDistribution } from "./project-distribution";
import type { StatusCount } from "@/lib/repositories/dashboard-repository";

/** Conteos por estatus de ejemplo. */
const byStatus: StatusCount[] = [
  { label: "En ejecución", count: 5, pct: 42 },
  { label: "Propuesta", count: 3, pct: 25 },
  { label: "Suspendido", count: 2, pct: 17 },
  { label: "Finalizado", count: 2, pct: 17 },
];

/** Conteos por prioridad de ejemplo. */
const byPriority: StatusCount[] = [
  { label: "Crítica", count: 2, pct: 17 },
  { label: "Alta", count: 3, pct: 25 },
  { label: "Media", count: 5, pct: 42 },
  { label: "Baja", count: 2, pct: 17 },
];

/**
 * Tests de `ProjectDistribution`: encabezado, conteos con texto, orden canónico
 * y tonos de los chips de prioridad (§5.4).
 */
describe("ProjectDistribution", () => {
  it("renderiza el encabezado de sección", () => {
    render(<ProjectDistribution byStatus={byStatus} byPriority={byPriority} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Distribución" }),
    ).toBeInTheDocument();
  });

  it("muestra conteo y porcentaje por estatus", () => {
    render(<ProjectDistribution byStatus={byStatus} byPriority={byPriority} />);
    expect(screen.getByText("5 (42%)")).toBeInTheDocument();
    expect(screen.getByText("3 (25%)")).toBeInTheDocument();
  });

  it("ordena los estatus canónicamente (Propuesta primero)", () => {
    render(<ProjectDistribution byStatus={byStatus} byPriority={byPriority} />);
    const labels = screen
      .getAllByTestId("status-label")
      .map((node) => node.textContent);

    expect(labels).toEqual([
      "Propuesta",
      "En ejecución",
      "Suspendido",
      "Finalizado",
    ]);
  });

  it("muestra los chips de prioridad con su conteo", () => {
    render(<ProjectDistribution byStatus={byStatus} byPriority={byPriority} />);
    const chips = screen.getByText("Por prioridad").parentElement;

    expect(within(chips as HTMLElement).getByText("Crítica")).toBeInTheDocument();
    expect(within(chips as HTMLElement).getByText("Alta")).toBeInTheDocument();
    expect(within(chips as HTMLElement).getByText("Media")).toBeInTheDocument();
    expect(within(chips as HTMLElement).getByText("Baja")).toBeInTheDocument();
  });

  it("aplica tono danger a Crítica y warning a Alta", () => {
    render(<ProjectDistribution byStatus={byStatus} byPriority={byPriority} />);
    expect(screen.getByText("Crítica")).toHaveClass("text-danger");
    expect(screen.getByText("Alta")).toHaveClass("text-warning");
    expect(screen.getByText("Media")).toHaveClass("text-text-muted");
  });

  it("muestra texto vacío cuando no hay proyectos", () => {
    render(<ProjectDistribution byStatus={[]} byPriority={[]} />);
    expect(screen.getAllByText("Sin proyectos registrados.")).toHaveLength(2);
  });

  it("añade al final los estatus desconocidos sin perderlos", () => {
    const withUnknown: StatusCount[] = [
      ...byStatus,
      { label: "Archivado", count: 1, pct: 8 },
    ];
    render(<ProjectDistribution byStatus={withUnknown} byPriority={byPriority} />);
    expect(screen.getByText("Archivado")).toBeInTheDocument();
  });
});
