import { describe, it, expect } from "vitest";
import { applyFieldError } from "./form-errors";

describe("applyFieldError", () => {
  it("adds a new error to the map", () => {
    const prev = { email: "Escribe tu correo." };
    const next = applyFieldError(prev, "username", "Escribe tu usuario.");

    expect(next).toEqual({
      email: "Escribe tu correo.",
      username: "Escribe tu usuario.",
    });
    expect(next).not.toBe(prev);
  });

  it("returns the same reference when the error is unchanged", () => {
    const prev = { username: "Escribe tu usuario." };
    const next = applyFieldError(prev, "username", "Escribe tu usuario.");

    expect(next).toBe(prev);
  });

  it("replaces an existing error with a new one", () => {
    const prev = { username: "Escribe tu usuario." };
    const next = applyFieldError(prev, "username", "El usuario debe tener como máximo 50 caracteres.");

    expect(next).toEqual({ username: "El usuario debe tener como máximo 50 caracteres." });
    expect(next).not.toBe(prev);
  });

  it("removes the key when the error is null", () => {
    const prev = { username: "Escribe tu usuario.", email: "Escribe tu correo." };
    const next = applyFieldError(prev, "username", null);

    expect(next).toEqual({ email: "Escribe tu correo." });
    expect(next).not.toBe(prev);
  });

  it("returns the same reference when removing an absent key", () => {
    const prev = { email: "Escribe tu correo." };
    const next = applyFieldError(prev, "username", null);

    expect(next).toBe(prev);
    expect(next).toEqual({ email: "Escribe tu correo." });
  });

  it("adds a key when it is absent even if the map is empty", () => {
    const next = applyFieldError({}, "password", "Escribe tu contraseña.");

    expect(next).toEqual({ password: "Escribe tu contraseña." });
  });
});
