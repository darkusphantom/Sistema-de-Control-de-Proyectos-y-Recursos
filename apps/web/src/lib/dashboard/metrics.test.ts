import { describe, expect, it } from "vitest";
import {
  activeProjects,
  budgetExecution,
  countByPriority,
  countByStatus,
  filterByPeriod,
  inProgressProjects,
  sumMetric,
  weightedPhysicalProgress,
  type MetricProject,
} from "./metrics";

/**
 * Factory de proyectos con valores por defecto razonables; cada test sobrescribe
 * solo los campos que le interesan.
 */
function project(overrides: Partial<MetricProject> = {}): MetricProject {
  return {
    status: "En ejecución",
    priority: "Media",
    physicalProgress: 50,
    budgetTotal: 1000,
    budgetExecuted: 500,
    ...overrides,
  };
}

describe("weightedPhysicalProgress", () => {
  it("devuelve null con lista vacía", () => {
    expect(weightedPhysicalProgress([])).toBeNull();
  });

  it("pondera por presupuesto total (proyecto caro pesa más)", () => {
    // 100% con peso 900 y 0% con peso 100 => 90% ponderado, no 50% simple.
    const result = weightedPhysicalProgress([
      project({ physicalProgress: 100, budgetTotal: 900 }),
      project({ physicalProgress: 0, budgetTotal: 100 }),
    ]);
    expect(result).toBe(90);
  });

  it("coincide con la media simple cuando los pesos son iguales", () => {
    const result = weightedPhysicalProgress([
      project({ physicalProgress: 40, budgetTotal: 500 }),
      project({ physicalProgress: 60, budgetTotal: 500 }),
    ]);
    expect(result).toBe(50);
  });

  it("excluye proyectos sin avance o sin presupuesto", () => {
    const result = weightedPhysicalProgress([
      project({ physicalProgress: 80, budgetTotal: 1000 }),
      project({ physicalProgress: null, budgetTotal: 9999 }),
      project({ physicalProgress: 0, budgetTotal: null }),
    ]);
    expect(result).toBe(80);
  });

  it("devuelve null cuando ningún proyecto es ponderable", () => {
    const result = weightedPhysicalProgress([
      project({ physicalProgress: null }),
      project({ budgetTotal: 0 }),
    ]);
    expect(result).toBeNull();
  });

  it("redondea al entero más cercano", () => {
    // 33.333...% ponderado uniformemente => 33
    const result = weightedPhysicalProgress([
      project({ physicalProgress: 33, budgetTotal: 100 }),
      project({ physicalProgress: 33, budgetTotal: 100 }),
      project({ physicalProgress: 34, budgetTotal: 100 }),
    ]);
    expect(result).toBe(33);
  });

  it("ignora el signo del presupuesto negativo sin romper el denominador", () => {
    const result = weightedPhysicalProgress([
      project({ physicalProgress: 50, budgetTotal: -1000 }),
      project({ physicalProgress: 50, budgetTotal: 1000 }),
    ]);
    expect(result).toBe(50);
  });
});

describe("budgetExecution", () => {
  it("calcula el porcentaje redondeado", () => {
    expect(budgetExecution(45000, 66000)).toEqual({
      executed: 45000,
      total: 66000,
      pct: 68,
    });
  });

  it("devuelve pct null cuando el total es 0 (guardia de división por cero)", () => {
    expect(budgetExecution(0, 0)).toEqual({ executed: 0, total: 0, pct: null });
  });

  it("devuelve pct null cuando falta el total o el ejecutado", () => {
    expect(budgetExecution(100, null).pct).toBeNull();
    expect(budgetExecution(null, 100).pct).toBeNull();
  });

  it("conserva los montos aunque el porcentaje no sea calculable", () => {
    const result = budgetExecution(null, 5000);
    expect(result).toEqual({ executed: null, total: 5000, pct: null });
  });

  it("nunca devuelve NaN ni Infinity", () => {
    const result = budgetExecution(1, 0);
    expect(Number.isNaN(result.pct as number)).toBe(false);
    expect(result.pct).toBeNull();
  });
});

describe("countByStatus", () => {
  it("devuelve lista vacía sin proyectos", () => {
    expect(countByStatus([])).toEqual([]);
  });

  it("cuenta y calcula el porcentaje por estatus", () => {
    const result = countByStatus([
      project({ status: "En ejecución" }),
      project({ status: "En ejecución" }),
      project({ status: "Propuesta" }),
      project({ status: "Finalizado" }),
      project({ status: "Suspendido" }),
    ]);

    expect(result).toEqual([
      { label: "En ejecución", count: 2, pct: 40 },
      { label: "Propuesta", count: 1, pct: 20 },
      { label: "Finalizado", count: 1, pct: 20 },
      { label: "Suspendido", count: 1, pct: 20 },
    ]);
  });

  it("mantiene el orden de primera aparición", () => {
    const result = countByStatus([
      project({ status: "Propuesta" }),
      project({ status: "En ejecución" }),
    ]);
    expect(result.map((entry) => entry.label)).toEqual([
      "Propuesta",
      "En ejecución",
    ]);
  });
});

describe("countByPriority", () => {
  it("cuenta y calcula el porcentaje por prioridad", () => {
    const result = countByPriority([
      project({ priority: "Crítica" }),
      project({ priority: "Alta" }),
      project({ priority: "Alta" }),
      project({ priority: "Media" }),
    ]);

    expect(result).toEqual([
      { label: "Crítica", count: 1, pct: 25 },
      { label: "Alta", count: 2, pct: 50 },
      { label: "Media", count: 1, pct: 25 },
    ]);
  });

  it("devuelve lista vacía sin proyectos", () => {
    expect(countByPriority([])).toEqual([]);
  });
});

describe("activeProjects", () => {
  it("devuelve null sin proyectos", () => {
    expect(activeProjects([])).toBeNull();
  });

  it("cuenta todos los que no están finalizados", () => {
    const result = activeProjects([
      project({ status: "En ejecución" }),
      project({ status: "Propuesta" }),
      project({ status: "Suspendido" }),
      project({ status: "Finalizado" }),
    ]);
    expect(result).toBe(3);
  });

  it("devuelve 0 (no null) cuando todos están finalizados", () => {
    const result = activeProjects([
      project({ status: "Finalizado" }),
      project({ status: "Finalizado" }),
    ]);
    expect(result).toBe(0);
  });
});

describe("inProgressProjects", () => {
  it("devuelve null sin proyectos", () => {
    expect(inProgressProjects([])).toBeNull();
  });

  it("cuenta solo los proyectos en ejecución", () => {
    const result = inProgressProjects([
      project({ status: "En ejecución" }),
      project({ status: "En ejecución" }),
      project({ status: "Propuesta" }),
    ]);
    expect(result).toBe(2);
  });
});

describe("sumMetric", () => {
  it("suma ignorando nulls", () => {
    const result = sumMetric(
      [project({ budgetTotal: 100.5 }), project({ budgetTotal: null }), project({ budgetTotal: 200 })],
      (p) => p.budgetTotal,
    );
    expect(result).toBe(300.5);
  });

  it("devuelve null cuando todos los valores son null", () => {
    const result = sumMetric([project({ budgetTotal: null })], (p) => p.budgetTotal);
    expect(result).toBeNull();
  });

  it("devuelve 0 cuando todos los valores son 0", () => {
    const result = sumMetric([project({ budgetTotal: 0 })], (p) => p.budgetTotal);
    expect(result).toBe(0);
  });
});

describe("filterByPeriod", () => {
  const now = new Date("2026-10-20T10:42:00");

  it("incluye solo los elementos de hoy con el período 'hoy'", () => {
    const items = [
      { date: "2026-10-20T08:00:00" },
      { date: "2026-10-19T23:59:00" },
    ];
    expect(filterByPeriod(items, "hoy", now)).toHaveLength(1);
  });

  it("incluye los últimos 7 días naturales con 'semana'", () => {
    const items = [
      { date: "2026-10-20T09:00:00" }, // hoy
      { date: "2026-10-14T09:00:00" }, // 6 días atrás → límite inclusive
      { date: "2026-10-13T09:00:00" }, // 7 días atrás → fuera
    ];
    expect(filterByPeriod(items, "semana", now)).toHaveLength(2);
  });

  it("incluye los últimos 30 días naturales con 'mes'", () => {
    const items = [
      { date: "2026-10-20T09:00:00" },
      { date: "2026-09-21T09:00:00" }, // 29 días atrás → límite inclusive
      { date: "2026-09-20T09:00:00" }, // 30 días atrás → fuera
    ];
    expect(filterByPeriod(items, "mes", now)).toHaveLength(2);
  });

  it("incluye los últimos 90 días naturales con 'trimestre'", () => {
    const items = [
      { date: "2026-10-20T09:00:00" },
      { date: "2026-07-23T09:00:00" }, // 89 días atrás → límite inclusive
      { date: "2026-07-22T09:00:00" }, // 90 días atrás → fuera
    ];
    expect(filterByPeriod(items, "trimestre", now)).toHaveLength(2);
  });

  it("descarta fechas futuras a 'now'", () => {
    const items = [{ date: "2026-10-21T09:00:00" }];
    expect(filterByPeriod(items, "trimestre", now)).toHaveLength(0);
  });

  it("descarta fechas inválidas sin lanzar", () => {
    const items = [{ date: "no-es-fecha" }];
    expect(filterByPeriod(items, "mes", now)).toHaveLength(0);
  });

  it("conserva el orden original de los elementos", () => {
    const items = [
      { date: "2026-10-18T09:00:00", id: "a" },
      { date: "2026-10-20T09:00:00", id: "b" },
    ];
    expect(filterByPeriod(items, "semana", now).map((i) => i.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("devuelve lista vacía sin elementos", () => {
    expect(filterByPeriod([], "mes", now)).toEqual([]);
  });
});
