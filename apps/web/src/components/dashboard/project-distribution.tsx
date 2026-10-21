import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { StatusCount } from "@/lib/repositories/dashboard-repository";

/**
 * Orden canónico de estatus para la distribución por estatus (§5.4).
 *
 * Se fija aquí para que la lista mantenga un orden estable de lectura incluso
 * cuando el repositorio emite los grupos en orden de primera aparición.
 */
const CANONICAL_STATUS_ORDER = [
  "Propuesta",
  "En ejecución",
  "Suspendido",
  "Finalizado",
] as const;

/** Tono de badge por prioridad (roadmap §3.1: colores semánticos). */
const PRIORITY_TONES: Record<string, BadgeTone> = {
  Crítica: "danger",
  Alta: "warning",
  Media: "neutral",
  Baja: "muted",
};

/** Props aceptadas por {@link ProjectDistribution}. */
export type ProjectDistributionProps = {
  /** Conteos por estatus. */
  byStatus: StatusCount[];
  /** Conteos por prioridad. */
  byPriority: StatusCount[];
};

/**
 * Ordena los conteos por estatus según el orden canónico.
 *
 * Los estatus desconocidos (no previstos en el orden canónico) se añaden al
 * final preservando su orden de entrada, de modo que un valor nuevo no se
 * pierde silenciosamente.
 *
 * @param counts - Conteos por estatus.
 * @returns Nueva lista ordenada canónicamente.
 * @complexity O(s log s) — `s` es el número de estatus (constante pequeña).
 */
function orderStatusCounts(counts: StatusCount[]): StatusCount[] {
  const known = CANONICAL_STATUS_ORDER.map((label) =>
    counts.find((entry) => entry.label === label),
  ).filter((entry): entry is StatusCount => entry !== undefined);

  const unknown = counts.filter(
    (entry) => !CANONICAL_STATUS_ORDER.includes(entry.label as never),
  );

  return [...known, ...unknown];
}

/**
 * Subsección "Por estatus": barras compactas con conteo y porcentaje.
 *
 * Cada fila lleva **texto de etiqueta + número**: el color y la barra son
 * refuerzo, nunca el único portador de significado (SC 1.4.1).
 *
 * @param props - Conteos por estatus.
 * @returns La lista de estatus con conteo y porcentaje.
 */
function StatusBreakdown({ counts }: { counts: StatusCount[] }) {
  const ordered = orderStatusCounts(counts);
  const maxCount = ordered.reduce(
    (max, entry) => Math.max(max, entry.count),
    0,
  );

  return (
    <ul className="flex flex-col gap-2">
      {ordered.map((entry) => {
        const width = maxCount === 0 ? 0 : (entry.count / maxCount) * 100;

        return (
          <li key={entry.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-text" data-testid="status-label">
                {entry.label}
              </span>
              <span className="shrink-0 tabular-nums text-text-muted">
                {entry.count} ({entry.pct}%)
              </span>
            </div>
            <span
              aria-hidden="true"
              className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
            >
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${width}%` }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Sección "Distribución" del dashboard (§5.4).
 *
 * - **Por estatus**: conteo y porcentaje con barra compacta.
 * - **Por prioridad**: chips `Badge` con conteos y colores semánticos
 *   (Crítica=`danger`, Alta=`warning`, Media=`neutral`, Baja=`muted`).
 * - Todo valor va acompañado de su etiqueta textual.
 *
 * @param props - Props de la sección.
 * @returns La sección de distribución con ambas sublistas.
 */
export function ProjectDistribution({
  byStatus,
  byPriority,
}: ProjectDistributionProps) {
  return (
    <section
      aria-labelledby="project-distribution-heading"
      className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5"
    >
      <h2
        id="project-distribution-heading"
        className="font-display text-h3 text-text"
      >
        Distribución
      </h2>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-text-muted">Por estatus</h3>
        {byStatus.length === 0 ? (
          <p className="text-sm text-text-muted">Sin proyectos registrados.</p>
        ) : (
          <StatusBreakdown counts={byStatus} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-text-muted">Por prioridad</h3>
        {byPriority.length === 0 ? (
          <p className="text-sm text-text-muted">Sin proyectos registrados.</p>
        ) : (
          <ul className="flex flex-wrap items-center gap-2">
            {byPriority.map((entry) => (
              <li key={entry.label}>
                <Badge tone={PRIORITY_TONES[entry.label] ?? "neutral"}>
                  {entry.label}
                </Badge>
                <span className="ml-1 text-sm tabular-nums text-text">
                  {entry.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
