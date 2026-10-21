import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardHeader } from "./dashboard-header";
import type { DashboardPeriod } from "@/lib/repositories/dashboard-repository";

const referenceDate = new Date("2026-10-20T10:42:00");

/** Renderiza la cabecera con valores por defecto sobreescribibles. */
function renderHeader(
  overrides: Partial<{
    period: DashboardPeriod;
    onPeriodChange: (period: DashboardPeriod) => void;
  }> = {},
) {
  return render(
    <DashboardHeader
      referenceDate={referenceDate}
      period={overrides.period ?? "mes"}
      onPeriodChange={overrides.onPeriodChange ?? vi.fn()}
    />,
  );
}

/**
 * Tests de `DashboardHeader`: h1 único, fecha en es-ES, selector de escritorio y
 * segmented control accesible de móvil (§4).
 */
describe("DashboardHeader", () => {
  it("renderiza un único h1 'Dashboard'", () => {
    renderHeader();
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Dashboard");
  });

  it("muestra la fecha formateada en es-ES con 'Hoy'", () => {
    renderHeader();
    const text = screen.getByText(/Hoy,/);
    expect(text).toHaveTextContent("20 de octubre de 2026");
    expect(text).toHaveTextContent("10:42");
  });

  it("renderiza el select de escritorio con el período activo", () => {
    renderHeader({ period: "semana" });
    const select = screen.getByRole("combobox", { name: "Período" });
    expect(select).toHaveValue("semana");
  });

  it("notifica el cambio de período desde el select", async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    renderHeader({ onPeriodChange });

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Período" }),
      "trimestre",
    );
    expect(onPeriodChange).toHaveBeenCalledWith("trimestre");
  });

  it("expone los cuatro radios del segmented control móvil", () => {
    renderHeader();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(4);
    expect(radios.map((radio) => radio.textContent)).toEqual([
      "Hoy",
      "Semana",
      "Mes",
      "Trimestre",
    ]);
  });

  it("marca con aria-checked el período activo y solo uno", () => {
    renderHeader({ period: "mes" });
    const radios = screen.getAllByRole("radio");
    const checked = radios.filter(
      (radio) => radio.getAttribute("aria-checked") === "true",
    );
    expect(checked).toHaveLength(1);
    expect(checked[0]).toHaveTextContent("Mes");
  });

  it("aplica roving tabindex (solo el activo es tabulable)", () => {
    renderHeader({ period: "semana" });
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("tabindex", "-1");
    expect(radios[1]).toHaveAttribute("tabindex", "0");
  });

  it("cambia de período con la flecha derecha en el radiogroup", async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    renderHeader({ period: "mes", onPeriodChange });

    const active = screen.getByRole("radio", { checked: true });
    active.focus();
    await user.keyboard("{ArrowRight}");

    expect(onPeriodChange).toHaveBeenCalledWith("trimestre");
  });

  it("cambia de período con la flecha izquierda", async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    renderHeader({ period: "mes", onPeriodChange });

    const active = screen.getByRole("radio", { checked: true });
    active.focus();
    await user.keyboard("{ArrowLeft}");

    expect(onPeriodChange).toHaveBeenCalledWith("semana");
  });

  it("envuelve al último período con la flecha izquierda desde el primero", async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    renderHeader({ period: "hoy", onPeriodChange });

    const active = screen.getByRole("radio", { checked: true });
    active.focus();
    await user.keyboard("{ArrowLeft}");

    expect(onPeriodChange).toHaveBeenCalledWith("trimestre");
  });

  it("salta al primer período con la tecla Home", async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    renderHeader({ period: "trimestre", onPeriodChange });

    const active = screen.getByRole("radio", { checked: true });
    active.focus();
    await user.keyboard("{Home}");

    expect(onPeriodChange).toHaveBeenCalledWith("hoy");
  });

  it("salta al último período con la tecla End", async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    renderHeader({ period: "hoy", onPeriodChange });

    const active = screen.getByRole("radio", { checked: true });
    active.focus();
    await user.keyboard("{End}");

    expect(onPeriodChange).toHaveBeenCalledWith("trimestre");
  });

  it("cambia de período con la flecha abajo (mismo sentido que la derecha)", async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    renderHeader({ period: "mes", onPeriodChange });

    const active = screen.getByRole("radio", { checked: true });
    active.focus();
    await user.keyboard("{ArrowDown}");

    expect(onPeriodChange).toHaveBeenCalledWith("trimestre");
  });

  it("ignora teclas no contempladas en el radiogroup", async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    renderHeader({ period: "mes", onPeriodChange });

    const active = screen.getByRole("radio", { checked: true });
    active.focus();
    await user.keyboard("{Escape}");

    expect(onPeriodChange).not.toHaveBeenCalled();
  });

  it("permite seleccionar un período haciendo clic en el radio", async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    renderHeader({ period: "mes", onPeriodChange });

    await user.click(screen.getByRole("radio", { name: "Hoy" }));
    expect(onPeriodChange).toHaveBeenCalledWith("hoy");
  });
});
