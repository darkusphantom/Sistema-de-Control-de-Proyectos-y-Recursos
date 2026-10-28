import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectProgress, MAX_VISIBLE_PROJECTS } from "./project-progress";
import type { ProjectProgressRow } from "@/lib/repositories/dashboard-repository";

/** Crea una fila de avance con código, nombre y porcentaje. */
function row(code: string, name: string, progress: number | null): ProjectProgressRow {
  return { code, name, progress };
}

const rows: ProjectProgressRow[] = [
  row("PRY-001", "Análisis de aguas residuales", 80),
  row("PRY-002", "Síntesis de catalizadores", 45),
  row("PRY-003", "Control de calidad", 60),
];

/**
 * Tests de `ProjectProgress`: barras accesibles, umbrales de color, orden,
 * límite de filas y estado vacío (§5.3).
 */
describe("ProjectProgress", () => {
  it("renderiza el encabezado de sección", () => {
    render(<ProjectProgress rows={rows} />);
    expect(
      screen.getByRole("heading", { level: 2, name: /Avance por proyecto/i }),
    ).toBeInTheDocument();
  });

  it("expone una barra accesible por proyecto", () => {
    render(<ProjectProgress rows={rows} />);
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(3);

    const first = screen.getByRole("progressbar", {
      name: "Avance físico PRY-001",
    });
    expect(first).toHaveAttribute("aria-valuenow", "80");
    expect(first).toHaveAttribute("aria-valuemin", "0");
    expect(first).toHaveAttribute("aria-valuemax", "100");
  });

  it("acompaña la barra del número de porcentaje", () => {
    render(<ProjectProgress rows={rows} />);
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
  });

  it("aplica fill success en >=80, accent-teal en 50-79 y primary en <50", () => {
    const { container } = render(<ProjectProgress rows={rows} />);
    const fills = Array.from(
      container.querySelectorAll("[role='progressbar'] > span"),
    );

    expect(fills[0]).toHaveClass("bg-success");
    expect(fills[1]).toHaveClass("bg-primary");
    expect(fills[2]).toHaveClass("bg-accent-teal");
  });

  it("usa color neutro cuando el avance es null y muestra em dash", () => {
    const { container } = render(
      <ProjectProgress rows={[row("PRY-009", "Sin avance", null)]} />,
    );
    const fill = container.querySelector("[role='progressbar'] > span");
    expect(fill).toHaveClass("bg-surface-muted");
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("limita las filas visibles y deshabilita 'Ver todos los proyectos'", () => {
    const many = Array.from({ length: 8 }, (_, index) =>
      row(`PRY-${index}`, `Proyecto ${index}`, 50),
    );
    render(<ProjectProgress rows={many} />);

    expect(screen.getAllByRole("progressbar")).toHaveLength(
      MAX_VISIBLE_PROJECTS,
    );
    expect(
      screen.getByRole("button", { name: /Ver todos los proyectos/i }),
    ).toBeDisabled();
  });

  it("muestra el EmptyState cuando no hay filas", () => {
    render(<ProjectProgress rows={[]} />);
    expect(screen.getByText("No hay proyectos activos")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("no duplica el encabezado de nivel 2 en el estado vacío", () => {
    render(<ProjectProgress rows={[]} />);
    // Solo el h2 de la sección; el título del EmptyState no es encabezado.
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: /Avance por proyecto/i }),
    ).toBeInTheDocument();
  });

  it("expone 'Sin dato' como valuetext cuando el avance es null", () => {
    render(<ProjectProgress rows={[row("PRY-009", "Sin medición", null)]} />);
    const bar = screen.getByRole("progressbar", {
      name: "Avance físico PRY-009",
    });
    expect(bar).toHaveAttribute("aria-valuetext", "Sin dato");
    expect(bar).not.toHaveAttribute("aria-valuenow");
  });
});
