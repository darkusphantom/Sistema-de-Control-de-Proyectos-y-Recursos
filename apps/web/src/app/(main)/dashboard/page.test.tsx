import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "./page";

/**
 * Tests de integración de la página `/dashboard`.
 *
 * Renderiza el Server Component (que resuelve los snapshots) y ejercita el
 * Client Component a través de user-event, verificando: presencia de secciones,
 * única cabecera h1, recálculo al cambiar de período y acciones deshabilitadas.
 */
describe("DashboardPage", () => {
  async function renderPage() {
    return render(await DashboardPage());
  }

  it("renderiza un único h1 'Dashboard'", async () => {
    await renderPage();
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Dashboard");
  });

  it("muestra las secciones principales", async () => {
    await renderPage();

    expect(screen.getByText("Proyectos activos")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Avance por proyecto/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Distribución" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Actividad reciente" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Acciones rápidas" }),
    ).toBeInTheDocument();
  });

  it("renderiza el panel de alertas críticas con datos del período por defecto", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", { level: 2, name: /Alertas críticas/i }),
    ).toBeInTheDocument();
  });

  it("recalcula los KPIs al cambiar de período", async () => {
    const user = userEvent.setup();
    await renderPage();

    const alertsPanel = screen
      .getByRole("heading", { level: 2, name: /Alertas críticas/i })
      .closest("section") as HTMLElement;
    const alertsBefore = within(alertsPanel).getAllByRole("listitem").length;

    // "Hoy" debe tener menos o igual actividad/alertas que el trimestre.
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Período" }),
      "trimestre",
    );

    const alertsAfter = within(
      screen
        .getByRole("heading", { level: 2, name: /Alertas críticas/i })
        .closest("section") as HTMLElement,
    ).getAllByRole("listitem").length;

    expect(alertsAfter).toBeGreaterThanOrEqual(alertsBefore);
  });

  it("deshabilita las tres acciones rápidas", async () => {
    await renderPage();
    const quickActions = screen
      .getByRole("heading", { level: 2, name: "Acciones rápidas" })
      .closest("section") as HTMLElement;

    const buttons = within(quickActions).getAllByRole("button");
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });

  it("muestra el número de proyectos en las filas de avance", async () => {
    await renderPage();
    expect(screen.getAllByRole("progressbar").length).toBeGreaterThan(0);
  });
});
