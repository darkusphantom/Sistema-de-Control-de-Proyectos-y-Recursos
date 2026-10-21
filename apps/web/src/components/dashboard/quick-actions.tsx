import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "@/components/ui/icons";

/** Definición de una acción rápida del dashboard. */
type QuickAction = {
  /** Etiqueta visible del botón. */
  label: string;
  /** Ícono decorativo de la acción. */
  icon: ReactNode;
};

/**
 * Acciones rápidas del dashboard (§5.6).
 *
 * Las tres acciones se muestran **deshabilitadas** en esta fase porque sus
 * rutas destino (`/projects/new`, `/expenses/new`, `/dispatches/new`) aún no
 * existen (deuda D1 registrada en `docs/roadmap-pivot.md` §2.1). Se usa el
 * atributo nativo `disabled` (semántica clara y foco manejado por el navegador),
 * un badge `muted` "Próximamente" y un texto de ayuda explícito; **no** se
 * renderiza ningún enlace a una ruta inexistente.
 *
 * @returns La sección de acciones rápidas.
 */
export function QuickActions() {
  const actions: QuickAction[] = [
    { label: "Nuevo proyecto", icon: <PlusIcon className="size-5" /> },
    { label: "Nueva solicitud de gasto", icon: <PlusIcon className="size-5" /> },
    { label: "Registrar despacho", icon: <PlusIcon className="size-5" /> },
  ];

  return (
    <section
      aria-labelledby="quick-actions-heading"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
    >
      <h2
        id="quick-actions-heading"
        className="font-display text-h3 text-text"
      >
        Acciones rápidas
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled
            className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-left text-text disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-text-muted shrink-0" aria-hidden="true">
              {action.icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{action.label}</span>
              <span className="text-xs text-text-muted">
                Disponible en una fase posterior
              </span>
            </span>
            <Badge tone="muted">Próximamente</Badge>
          </button>
        ))}
      </div>
    </section>
  );
}
