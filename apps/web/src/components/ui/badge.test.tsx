import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, type BadgeTone } from "./badge";

/**
 * Tests del primitivo `Badge`, incluido el tono `danger` añadido en la Fase 2b
 * del pivot para la severidad "Crítica" y las alertas de aprobación.
 */
describe("Badge", () => {
  it("renderiza siempre el texto de la etiqueta (SC 1.4.1)", () => {
    render(<Badge tone="neutral">Media</Badge>);
    expect(screen.getByText("Media")).toBeInTheDocument();
  });

  it("aplica el color de texto del tono", () => {
    render(<Badge tone="warning">Alta</Badge>);
    expect(screen.getByText("Alta")).toHaveClass("text-warning");
  });

  it("soporta el tono danger con text-danger", () => {
    render(<Badge tone="danger">Crítica</Badge>);
    expect(screen.getByText("Crítica")).toHaveClass("text-danger");
  });

  it("soporta el tono muted con text-text-muted", () => {
    render(<Badge tone="muted">Próximamente</Badge>);
    expect(screen.getByText("Próximamente")).toHaveClass("text-text-muted");
  });

  it.each<BadgeTone>([
    "neutral",
    "category",
    "success",
    "muted",
    "warning",
    "danger",
  ])("comparte el fondo --surface-muted en el tono %s", (tone) => {
    render(<Badge tone={tone}>Etiqueta</Badge>);
    expect(screen.getByText("Etiqueta")).toHaveClass("bg-surface-muted");
  });

  it("renderiza el ícono opcional antes del texto", () => {
    render(
      <Badge tone="danger" icon={<svg data-testid="icon" />}>
        Crítica
      </Badge>,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
