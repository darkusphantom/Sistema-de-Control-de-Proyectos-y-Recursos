import { DashboardView } from "@/components/dashboard/dashboard-view";
import { StaticDashboardRepository } from "@/lib/repositories/dashboard-repository.static";
import type {
  DashboardPeriod,
  DashboardSnapshot,
} from "@/lib/repositories/dashboard-repository";

/** Períodos para los que se resuelve el snapshot en el servidor. */
const PERIODS: DashboardPeriod[] = ["hoy", "semana", "mes", "trimestre"];

/** Repositorio estático del dashboard (fase sin backend; Fase 5 lo sustituye). */
const dashboardRepository = new StaticDashboardRepository();

/**
 * Dashboard ejecutivo — `/dashboard` (Fase 2b del pivot).
 *
 * Server Component que resuelve el snapshot de cada período en el servidor y lo
 * entrega serializado a {@link DashboardView}, un Client Component que solo
 * gestiona el estado del selector de período. Así el primer render es estático
 * y cambiar de período no dispara peticiones desde el navegador
 * (`docs/design/wireframes_dashboard.md` §7).
 *
 * Visible para todos los roles autenticados; el shell de `(main)` garantiza la
 * sesión (ver `docs/architecture/frontend-structure.md` §3).
 *
 * @returns La página del dashboard ejecutivo.
 */
export default async function DashboardPage() {
  // Una única referencia temporal para los 4 snapshots y para la vista: evita
  // que dos períodos se calculen sobre instantes distintos (ver contrato
  // `DashboardRepository.getSnapshot`).
  const now = new Date();
  const nowIso = now.toISOString();

  const snapshotEntries = await Promise.all(
    PERIODS.map(
      async (period) =>
        [period, await dashboardRepository.getSnapshot(period, now)] as const,
    ),
  );

  const snapshots = Object.fromEntries(snapshotEntries) as Record<
    DashboardPeriod,
    DashboardSnapshot
  >;

  return <DashboardView snapshots={snapshots} nowIso={nowIso} />;
}
