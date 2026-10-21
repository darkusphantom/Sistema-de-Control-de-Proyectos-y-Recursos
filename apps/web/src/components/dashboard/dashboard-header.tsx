"use client";

import { useId, useRef } from "react";
import { SelectField } from "@/components/ui/select-field";
import { cn } from "@/lib/cn";
import {
  DASHBOARD_PERIOD_LABELS,
  type DashboardPeriod,
} from "@/lib/repositories/dashboard-repository";

/** Orden fijo de los períodos en el selector. */
const PERIODS: DashboardPeriod[] = ["hoy", "semana", "mes", "trimestre"];

/** Props aceptadas por {@link DashboardHeader}. */
export type DashboardHeaderProps = {
  /** Fecha/hora de referencia, formateada en la cabecera (determinista). */
  referenceDate: Date;
  /** Período seleccionado actualmente. */
  period: DashboardPeriod;
  /** Callback invocado al cambiar el período. */
  onPeriodChange: (period: DashboardPeriod) => void;
};

/**
 * Formatea la fecha y hora de referencia en español (`es-ES`).
 *
 * Formato: `"Hoy, 20 de octubre de 2026 · 10:42"`. Se calcula a partir de la
 * fecha recibida (no de la hora del navegador) para que el render del servidor
 * y el del cliente coincidan y no haya desajuste de hidratación.
 *
 * @param date - Instante de referencia.
 * @returns La cadena formateada en español.
 * @complexity O(1) — dos llamadas a `Intl.DateTimeFormat`.
 */
function formatHeaderDate(date: Date): string {
  const day = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const time = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `Hoy, ${day} · ${time}`;
}

/**
 * Cabecera del dashboard ejecutivo (§4).
 *
 * - `h1` único "Dashboard" (la página no renderiza otro h1).
 * - Fecha/hora formateada en `es-ES`, sin temporizador por segundo.
 * - Selector de período en dos variantes responsivas (mismo modelo de datos):
 *   `SelectField` en pantallas ≥640px y un **segmented control** accesible
 *   (`role="radiogroup"` con `role="radio"` + `aria-checked`) en móvil, con
 *   targets táctiles de ≥44px.
 *
 * @param props - Props de la cabecera.
 * @returns La cabecera del dashboard.
 */
export function DashboardHeader({
  referenceDate,
  period,
  onPeriodChange,
}: DashboardHeaderProps) {
  const radioGroupName = useId();
  const radioRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /**
   * Mueve el foco entre radios con las flechas (patrón ARIA de radiogroup).
   *
   * @param event - Evento de teclado del radio activo.
   * @param index - Índice del radio que originó el evento.
   * @complexity O(1) — aritmética modular sobre 4 períodos.
   */
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const lastIndex = PERIODS.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = index === lastIndex ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = index === 0 ? lastIndex : index - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    onPeriodChange(PERIODS[nextIndex]);
    radioRefs.current[nextIndex]?.focus();
  };

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-h2 font-bold text-text">Dashboard</h1>
        <p className="text-sm text-text-muted">{formatHeaderDate(referenceDate)}</p>
      </div>

      {/* Selector de escritorio */}
      <div className="hidden sm:block sm:w-44">
        <SelectField
          label="Período"
          value={period}
          onChange={(event) =>
            onPeriodChange(event.target.value as DashboardPeriod)
          }
        >
          {PERIODS.map((value) => (
            <option key={value} value={value}>
              {DASHBOARD_PERIOD_LABELS[value]}
            </option>
          ))}
        </SelectField>
      </div>

      {/* Segmented control de móvil */}
      <div
        role="radiogroup"
        aria-label="Período"
        className="grid w-full grid-cols-4 gap-1 rounded-md border border-border bg-surface-muted p-1 sm:hidden"
      >
        {PERIODS.map((value, index) => {
          const isActive = value === period;

          return (
            <button
              key={value}
              ref={(node) => {
                radioRefs.current[index] = node;
              }}
              type="button"
              role="radio"
              name={radioGroupName}
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onPeriodChange(value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "min-h-11 rounded-sm px-2 text-sm font-medium",
                isActive
                  ? "bg-surface text-text shadow-sm"
                  : "text-text-muted",
              )}
            >
              {DASHBOARD_PERIOD_LABELS[value]}
            </button>
          );
        })}
      </div>
    </header>
  );
}
