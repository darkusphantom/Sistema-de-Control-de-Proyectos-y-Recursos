import { describe, it, expect } from "vitest";
import {
  validateUsername,
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateLogin,
  validateRegister,
} from "./auth";

describe("Auth Validation", () => {
  describe("validateUsername", () => {
    it("returns null for valid username", () => {
      expect(validateUsername("j.rivas")).toBeNull();
    });
    it("returns error for empty or whitespace", () => {
      expect(validateUsername("")).toBe("Escribe tu usuario.");
      expect(validateUsername("   ")).toBe("Escribe tu usuario.");
    });
    it("returns error if > 50 chars", () => {
      expect(validateUsername("a".repeat(51))).toBe("El usuario debe tener como máximo 50 caracteres.");
    });
  });

  describe("validateName", () => {
    it("returns null for valid name", () => {
      expect(validateName("María")).toBeNull();
    });
    it("returns error for empty", () => {
      expect(validateName("")).toBe("Escribe tu nombre.");
      expect(validateName("", true)).toBe("Escribe tu apellido.");
    });
    it("returns error for length < 2 or > 100", () => {
      expect(validateName("a")).toBe("El nombre debe tener entre 2 y 100 caracteres.");
      expect(validateName("a".repeat(101))).toBe("El nombre debe tener entre 2 y 100 caracteres.");
    });
    it("returns error for invalid chars", () => {
      expect(validateName("John123")).toBe("El nombre debe tener entre 2 y 100 caracteres.");
    });
  });

  describe("validateEmail", () => {
    it("returns null for valid email", () => {
      expect(validateEmail("nombre@correo.com")).toBeNull();
    });
    it("returns error for empty", () => {
      expect(validateEmail("")).toBe("Escribe tu correo.");
    });
    it("returns error for invalid format", () => {
      expect(validateEmail("invalid-email")).toBe("Escribe un correo válido, por ejemplo nombre@correo.com.");
    });
    it("returns error for length > 254", () => {
      const longEmail = "a".repeat(245) + "@correo.com"; // > 254
      expect(validateEmail(longEmail)).toBe("El correo electrónico debe tener como máximo 254 caracteres.");
    });
  });

  describe("validatePassword", () => {
    it("returns null for valid password", () => {
      expect(validatePassword("password123")).toBeNull();
    });
    it("returns error for empty", () => {
      expect(validatePassword("")).toBe("Escribe tu contraseña.");
    });
    it("returns length error for register if < 8", () => {
      expect(validatePassword("1234567")).toBe("La contraseña debe tener entre 8 y 100 caracteres.");
    });
    it("returns length error for register if > 100", () => {
      expect(validatePassword("a".repeat(101))).toBe("La contraseña debe tener entre 8 y 100 caracteres.");
    });
    it("login password validation only checks presence and max length", () => {
      expect(validatePassword("short", true)).toBeNull();
      expect(validatePassword("a".repeat(101), true)).toBe("La contraseña debe tener como máximo 100 caracteres.");
    });
  });

  describe("validateConfirmPassword", () => {
    it("returns null if passwords match", () => {
      expect(validateConfirmPassword("password", "password")).toBeNull();
    });
    it("returns error for empty confirm", () => {
      expect(validateConfirmPassword("password", "")).toBe("Escribe la contraseña otra vez.");
    });
    it("returns error if mismatch", () => {
      expect(validateConfirmPassword("password", "different")).toBe("Las contraseñas no coinciden.");
    });
  });

  describe("validateLogin", () => {
    it("returns success for valid data", () => {
      const formData = new FormData();
      formData.append("username", "user");
      formData.append("password", "password");
      
      const result = validateLogin(formData);
      expect(result.success).toBe(true);
      expect(result.errors).toEqual({});
    });
    
    it("returns errors for invalid data", () => {
      const formData = new FormData();
      
      const result = validateLogin(formData);
      expect(result.success).toBe(false);
      expect(result.errors.username).toBe("Escribe tu usuario.");
      expect(result.errors.password).toBe("Escribe tu contraseña.");
    });
  });

  describe("validateRegister", () => {
    it("returns success for valid data", () => {
      const formData = new FormData();
      formData.append("given-name", "John");
      formData.append("family-name", "Doe");
      formData.append("email", "john@example.com");
      formData.append("new-password", "password123");
      formData.append("confirm-password", "password123");
      
      const result = validateRegister(formData);
      expect(result.success).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("returns errors for invalid data", () => {
      const formData = new FormData();
      
      const result = validateRegister(formData);
      expect(result.success).toBe(false);
      expect(result.errors["given-name"]).toBe("Escribe tu nombre.");
      expect(result.errors["family-name"]).toBe("Escribe tu apellido.");
      expect(result.errors.email).toBe("Escribe tu correo.");
      expect(result.errors["new-password"]).toBe("Escribe tu contraseña.");
      expect(result.errors["confirm-password"]).toBe("Escribe la contraseña otra vez.");
    });
  });
});
