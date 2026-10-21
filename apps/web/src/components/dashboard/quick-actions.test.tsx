import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickActions } from "./quick-actions";

/**
 * Tests de `QuickActions`: las tres acciones, estado deshabilitado nativo, badge
 * "Próximamente" y ausencia de enlaces (§5.6, D1).
 */
describe("QuickActions", () => {
  it("renderiza el encabezado de sección", () => {
    render(<QuickActions />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Acciones rápidas" }),
    ).toBeInTheDocument();
  });

  it("renderiza las tres acciones", () => {
    render(<QuickActions />);
    expect(screen.getByRole("button", { name: /Nuevo proyecto/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Nueva solicitud de gasto/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Registrar despacho/i }),
    ).toBeInTheDocument();
  });

  it("deshabilita nativamente las tres acciones", () => {
    render(<QuickActions />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("type", "button");
    }
  });

  it("muestra el badge 'Próximamente' y el texto de ayuda", () => {
    render(<QuickActions />);
    expect(screen.getAllByText("Próximamente")).toHaveLength(3);
    expect(
      screen.getAllByText("Disponible en una fase posterior"),
    ).toHaveLength(3);
  });

  it("no renderiza ningún enlace a rutas inexistentes", () => {
    const { container } = render(<QuickActions />);
    expect(container.querySelector("a")).toBeNull();
  });
});
