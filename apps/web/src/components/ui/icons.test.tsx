import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import * as icons from "./icons";

/**
 * Comprueba que todos los iconos exportados renderizan un SVG.
 * Mantiene la cobertura de funciones del módulo `icons.tsx` sin duplicar un
 * test manual por cada icono que se agregue al catálogo.
 */
describe("icons", () => {
  const entries = Object.entries(icons).filter(
    (entry): entry is [string, (typeof icons)[keyof typeof icons]] =>
      typeof entry[1] === "function",
  );

  it("exports an icon catalogue", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)("%s renders an svg element", (name, Icon) => {
    const { container } = render(<Icon />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it.each(entries)("%s forwards the className to the svg", (name, Icon) => {
    const { container } = render(<Icon className="size-4" />);
    expect(container.querySelector("svg")).toHaveClass("size-4");
  });
});
