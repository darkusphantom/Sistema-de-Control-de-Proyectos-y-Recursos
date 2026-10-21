import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ActivityFeed,
  MAX_VISIBLE_ACTIVITY,
  formatRelativeTime,
} from "./activity-feed";
import type { ActivityItem, ActivityItemType } from "@/lib/repositories/dashboard-repository";

const now = new Date("2026-10-20T12:00:00Z");

/** Crea un ítem de actividad con un desfase de horas respecto a `now`. */
function item(
  id: string,
  type: ActivityItemType,
  description: string,
  hoursAgo: number,
): ActivityItem {
  return {
    id,
    type,
    description,
    date: new Date(now.getTime() - hoursAgo * 3_600_000).toISOString(),
  };
}

const items: ActivityItem[] = [
  item("act-1", "dispatch", "Despacho DSP-014 — Reactivo H₂SO₄ (12 L)", 2),
  item("act-2", "priority_change", "PRY-002 cambió de prioridad: Media → Alta", 72),
  item("act-3", "expense_request", "Solicitud SG-007 de $450 pendiente", 0.5),
];

describe("formatRelativeTime", () => {
  it("devuelve 'hace unos minutos' para menos de una hora", () => {
    const date = new Date(now.getTime() - 30 * 60_000).toISOString();
    expect(formatRelativeTime(date, now)).toBe("hace unos minutos");
  });

  it("devuelve horas para menos de un día", () => {
    const date = new Date(now.getTime() - 2 * 3_600_000).toISOString();
    expect(formatRelativeTime(date, now)).toBe("hace 2 h");
  });

  it("devuelve días para 24 horas o más", () => {
    const date = new Date(now.getTime() - 3 * 86_400_000).toISOString();
    expect(formatRelativeTime(date, now)).toBe("hace 3 d");
  });

  it("devuelve cadena vacía para fechas futuras", () => {
    const date = new Date(now.getTime() + 60_000).toISOString();
    expect(formatRelativeTime(date, now)).toBe("");
  });

  it("devuelve cadena vacía para fechas inválidas", () => {
    expect(formatRelativeTime("no-es-fecha", now)).toBe("");
  });
});

describe("ActivityFeed", () => {
  it("renderiza el encabezado de sección", () => {
    render(<ActivityFeed items={items} now={now} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Actividad reciente" }),
    ).toBeInTheDocument();
  });

  it("renderiza una lista ordenada (<ol>)", () => {
    const { container } = render(<ActivityFeed items={items} now={now} />);
    expect(container.querySelector("ol")).toBeInTheDocument();
    expect(container.querySelectorAll("ol li")).toHaveLength(3);
  });

  it("usa <time dateTime> con el texto relativo", () => {
    const { container } = render(<ActivityFeed items={items} now={now} />);
    const times = container.querySelectorAll("time");
    expect(times).toHaveLength(3);
    expect(times[0]).toHaveAttribute("dateTime", items[0].date);
    expect(times[0]).toHaveTextContent("hace 2 h");
    expect(times[1]).toHaveTextContent("hace 3 d");
  });

  it("muestra las descripciones en español", () => {
    render(<ActivityFeed items={items} now={now} />);
    expect(
      screen.getByText("PRY-002 cambió de prioridad: Media → Alta"),
    ).toBeInTheDocument();
  });

  it("limita los ítems visibles y deshabilita 'Ver bitácora'", () => {
    const many = Array.from({ length: 9 }, (_, index) =>
      item(`a${index}`, "dispatch", `Evento ${index}`, index + 1),
    );
    const { container } = render(<ActivityFeed items={many} now={now} />);

    expect(container.querySelectorAll("ol li")).toHaveLength(
      MAX_VISIBLE_ACTIVITY,
    );
    expect(screen.getByRole("button", { name: /Ver bitácora/i })).toBeDisabled();
  });

  it("muestra el EmptyState cuando no hay actividad", () => {
    render(<ActivityFeed items={[]} now={now} />);
    expect(
      screen.getByText("No hay actividad reciente en este período"),
    ).toBeInTheDocument();
  });
});
