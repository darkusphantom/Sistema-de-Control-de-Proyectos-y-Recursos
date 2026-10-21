import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { SlidersIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/cn";
import type { ProjectProgressRow } from "@/lib/repositories/dashboard-repository";

/** Máximo de filas de avance visibles antes de "Ver todos los proyectos". */
export const MAX_VISIBLE_PROJECTS = 6;

/** Props aceptadas por {@link ProjectProgress}. */
export type ProjectProgressProps = {
  /** Filas de avance físico por proyecto (ya ordenadas por el repositorio). */
  rows: ProjectProgressRow[];
};

/**
 * Devuelve la clase del relleno de la barra según el umbral de avance (§5.3).
 *
 * Umbrales: `<50%` en `--primary`, `50–79%` en `--accent-teal` y `≥80%` en
 * `--success`. Los proyectos sin dato (`null`) usan el color neutro.
 *
 * @param progress - Porcentaje de avance, o `null`.
 * @returns La clase Tailwind del relleno.
 * @complexity O(1) — comparaciones constantes.
 */
function progressFillClass(progress: number | null): string {
  if (progress === null) {
    return "bg-surface-muted";
  }

  if (progress >= 80) {
    return "bg-success";
  }

  if (progress >= 50) {
    return "bg-accent-teal";
  }

  return "bg-primary";
}

/**
 * Sección "Avance por proyecto" del dashboard (§5.3).
 *
 * - Barras con `role="progressbar"`, `aria-valuenow/min/max` y `aria-label`
 *   referido al código del proyecto.
 * - El color del relleno es un refuerzo: el porcentaje siempre va en texto.
 * - Máximo {@link MAX_VISIBLE_PROJECTS} filas; el pie queda deshabilitado con
 *   badge "Próximamente" (deuda D1).
 * - Sin proyectos activos muestra un `EmptyState`.
 *
 * @param props - Props de la sección.
 * @returns La sección de avance por proyecto.
 */
export function ProjectProgress({ rows }: ProjectProgressProps) {
  const visibleRows = rows.slice(0, MAX_VISIBLE_PROJECTS);

  return (
    <section
      aria-labelledby="project-progress-heading"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
    >
      <h2
        id="project-progress-heading"
        className="font-display text-h3 text-text"
      >
        Avance por proyecto
      </h2>

      {rows.length === 0 ? (
        <EmptyState
          icon={<SlidersIcon className="size-10" />}
          title="No hay proyectos activos"
          description="Cuando se registren proyectos aparecerán aquí sus indicadores."
        />
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {visibleRows.map((row) => {
              const progress = row.progress;
              const safeProgress = Math.min(Math.max(progress ?? 0, 0), 100);

              return (
                <li key={row.code} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-text">
                      <span className="font-medium">{row.code}</span>{" "}
                      <span className="text-text-muted">{row.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-text">
                      {progress === null ? "—" : `${progress}%`}
                    </span>
                  </div>

                  <span
                    role="progressbar"
                    aria-valuenow={progress === null ? undefined : safeProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Avance físico ${row.code}`}
                    className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
                  >
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        progressFillClass(progress),
                      )}
                      style={{ width: `${safeProgress}%` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className={cn(
              buttonStyles({ variant: "ghost", size: "sm" }),
              "self-start gap-2",
            )}
          >
            Ver todos los proyectos
            <Badge tone="muted">Próximamente</Badge>
          </button>
        </>
      )}
    </section>
  );
}
