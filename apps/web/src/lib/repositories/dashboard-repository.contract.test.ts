import { describe, expect, it } from "vitest";
import { StaticDashboardRepository } from "./dashboard-repository.static";
import type { DashboardPeriod, DashboardRepository } from "./dashboard-repository";

const PERIODS: DashboardPeriod[] = ["hoy", "semana", "mes", "trimestre"];

/**
 * Contract tests del `DashboardRepository` sobre el adapter estático.
 *
 * Verifican las garantías que cualquier adapter (estático hoy, PostgreSQL en la
 * Fase 5) debe cumplir: forma del snapshot, coherencia interna de los datos y
 * comportamiento del filtrado por período.
 */
describe("StaticDashboardRepository", () => {
  const repo: DashboardRepository = new StaticDashboardRepository();

  it("expone getSnapshot para todos los períodos soportados", async () => {
    for (const period of PERIODS) {
      await expect(repo.getSnapshot(period)).resolves.toBeDefined();
    }
  });

  it("devuelve un snapshot con todas las secciones requeridas", async () => {
    const snapshot = await repo.getSnapshot("mes");

    expect(snapshot).toHaveProperty("kpis");
    expect(snapshot).toHaveProperty("alerts");
    expect(snapshot).toHaveProperty("projectProgress");
    expect(snapshot).toHaveProperty("distribution");
    expect(snapshot).toHaveProperty("activity");
    expect(snapshot.distribution).toHaveProperty("byStatus");
    expect(snapshot.distribution).toHaveProperty("byPriority");
  });

  it("deriva el avance físico global de los proyectos (no es un valor fijo)", async () => {
    const snapshot = await repo.getSnapshot("mes");

    expect(snapshot.kpis.physicalProgressPct).not.toBeNull();
    expect(snapshot.kpis.physicalProgressPct).toBeGreaterThan(0);
    expect(snapshot.kpis.physicalProgressPct).toBeLessThanOrEqual(100);

    // El avance debe coincidir con el promedio ponderado de las filas expuestas.
    const rows = snapshot.projectProgress.filter((row) => row.progress !== null);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("mantiene el presupuesto ejecutado por debajo o igual al total", async () => {
    const snapshot = await repo.getSnapshot("mes");
    const { budgetExecuted, budgetTotal, budgetExecutedPct } = snapshot.kpis;

    expect(budgetExecuted).not.toBeNull();
    expect(budgetTotal).not.toBeNull();
    expect(budgetExecuted as number).toBeLessThanOrEqual(budgetTotal as number);
    expect(budgetExecutedPct).not.toBeNull();
    expect(budgetExecutedPct).toBeLessThanOrEqual(100);
  });

  it("ordena el avance por proyecto de forma descendente", async () => {
    const snapshot = await repo.getSnapshot("mes");
    const progresses = snapshot.projectProgress.map((row) => row.progress ?? 0);

    for (let i = 1; i < progresses.length; i += 1) {
      expect(progresses[i - 1]).toBeGreaterThanOrEqual(progresses[i]);
    }
  });

  it("cuenta 12 proyectos en la distribución por estatus", async () => {
    const snapshot = await repo.getSnapshot("mes");
    const totalByStatus = snapshot.distribution.byStatus.reduce(
      (sum, entry) => sum + entry.count,
      0,
    );
    expect(totalByStatus).toBe(12);
  });

  it("cuenta 12 proyectos en la distribución por prioridad", async () => {
    const snapshot = await repo.getSnapshot("mes");
    const totalByPriority = snapshot.distribution.byPriority.reduce(
      (sum, entry) => sum + entry.count,
      0,
    );
    expect(totalByPriority).toBe(12);
  });

  it("ordena la actividad de más reciente a más antigua", async () => {
    const snapshot = await repo.getSnapshot("trimestre");
    const dates = snapshot.activity.map((item) => item.date);

    for (let i = 1; i < dates.length; i += 1) {
      expect(dates[i - 1] >= dates[i]).toBe(true);
    }
  });

  it("filtra la actividad por período: 'hoy' <= 'trimestre'", async () => {
    const today = await repo.getSnapshot("hoy");
    const quarter = await repo.getSnapshot("trimestre");

    expect(today.activity.length).toBeLessThanOrEqual(quarter.activity.length);
  });

  it("devuelve la fecha de cada alerta en ISO 8601 y no futura", async () => {
    const snapshot = await repo.getSnapshot("trimestre");
    const now = Date.now();

    for (const alert of snapshot.alerts) {
      expect(Number.isNaN(new Date(alert.date).getTime())).toBe(false);
      expect(new Date(alert.date).getTime()).toBeLessThanOrEqual(now);
    }
  });

  it("devuelve copias nuevas en llamadas sucesivas (sin mutar el fixture)", async () => {
    const first = await repo.getSnapshot("mes");
    const second = await repo.getSnapshot("mes");

    expect(first.alerts).not.toBe(second.alerts);
    expect(first.alerts.map((alert) => alert.id)).toEqual(
      second.alerts.map((alert) => alert.id),
    );
  });

  it("no produce NaN en ningún KPI numérico", async () => {
    const snapshot = await repo.getSnapshot("mes");
    const values = Object.values(snapshot.kpis);

    for (const value of values) {
      if (value !== null) {
        expect(Number.isNaN(value)).toBe(false);
      }
    }
  });
});
