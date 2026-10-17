import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SelectField } from "./select-field";

describe("SelectField", () => {
  it("associates a visible label with the select via htmlFor", () => {
    render(
      <SelectField label="Rol">
        <option value="estudiante">Estudiante</option>
      </SelectField>,
    );

    const select = screen.getByRole("combobox", { name: "Rol" });
    expect(screen.getByText("Rol")).toHaveAttribute("for", select.id);
  });

  it("shows the hint and wires it through aria-describedby", () => {
    render(
      <SelectField label="Rol" hint="Selecciona un rol.">
        <option value="estudiante">Estudiante</option>
      </SelectField>,
    );

    const select = screen.getByRole("combobox", { name: "Rol" });
    const hint = screen.getByText("Selecciona un rol.");
    expect(select.getAttribute("aria-describedby")).toContain(hint.id);
    expect(select).not.toHaveAttribute("aria-invalid");
  });

  it("replaces the hint with an error, sets aria-invalid and role=alert", () => {
    render(
      <SelectField label="Rol" hint="Selecciona un rol." error="Rol inválido.">
        <option value="estudiante">Estudiante</option>
      </SelectField>,
    );

    const select = screen.getByRole("combobox", { name: "Rol" });
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Rol inválido.");
    expect(screen.queryByText("Selecciona un rol.")).toBeNull();
  });

  it("passes through native select attributes such as disabled", () => {
    render(
      <SelectField label="Rol" disabled>
        <option value="estudiante">Estudiante</option>
      </SelectField>,
    );

    expect(screen.getByRole("combobox", { name: "Rol" })).toBeDisabled();
  });
});
