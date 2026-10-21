import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AlertsPanel, MAX_VISIBLE_ALERTS } from "./alerts-panel";
import type { DashboardAlert, DashboardAlertType } from "@/lib/repositories/dashboard-repository";

/** Crea una alerta con un tipo y descripción dados. */
function alert(
  id: string,
  type: DashboardAlertType,
  description: string,
): DashboardAlert {
  return { id, type, description, date: "2026-10-20T08:00:00Z" };
}

const fourAlerts: DashboardAlert[] = [
  alert("a1", "stock", "Reactivo H₂SO₄ bajo mínimo"),
  alert("a2", "maintenance", "Equipo EQ-014 en mantenimiento"),
  alert("a3", "reservation", "Reserva del espectrofotómetro vence mañana"),
  alert("a4", "approval", "3 solicitudes pendientes de aprobación"),
];

/**
 * Tests de `AlertsPanel`: render condicional, badge por tipo, filas no
 * clicables y límite de filas (§5.1).
 */
describe("AlertsPanel", () => {
  it("no renderiza nada cuando no hay alertas", () => {
    const { container } = render(<AlertsPanel alerts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza el título y el contador en un badge", () => {
    render(<AlertsPanel alerts={fourAlerts} />);
    expect(
      screen.getByRole("heading", { level: 2, name: /Alertas críticas/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("muestra la etiqueta de tipo correcta por cada alerta", () => {
    render(<AlertsPanel alerts={fourAlerts} />);
    expect(screen.getByText("Stock")).toBeInTheDocument();
    expect(screen.getByText("Mantenimiento")).toBeInTheDocument();
    expect(screen.getByText("Reserva")).toBeInTheDocument();
    expect(screen.getByText("Aprobación")).toBeInTheDocument();
  });

  it("renderiza las descripciones en español", () => {
    render(<AlertsPanel alerts={fourAlerts} />);
    expect(
      screen.getByText("Reactivo H₂SO₄ bajo mínimo"),
    ).toBeInTheDocument();
  });

  it("no hace clicables las filas (div, no button)", () => {
    render(<AlertsPanel alerts={fourAlerts} />);
    const description = screen.getByText("Reactivo H₂SO₄ bajo mínimo");
    // La fila contenedora no es un botón ni un enlace.
    expect(description.closest("button")).toBeNull();
    expect(description.closest("a")).toBeNull();
  });

  it("limita las filas visibles al máximo y deshabilita 'Ver todas'", () => {
    const manyAlerts = Array.from({ length: 7 }, (_, index) =>
      alert(`a${index}`, "stock", `Alerta número ${index}`),
    );
    render(<AlertsPanel alerts={manyAlerts} />);

    expect(screen.getAllByText(/Alerta número/).length).toBe(MAX_VISIBLE_ALERTS);
    const seeAll = screen.getByRole("button", { name: /Ver todas/i });
    expect(seeAll).toBeDisabled();
  });
});
