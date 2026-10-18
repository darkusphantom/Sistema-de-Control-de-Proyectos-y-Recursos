import { describe, it, expect } from "vitest";
import { validateBio, validateAvatarFile, validateUpdateProfile, validateChangePassword } from "./profile";

describe("Profile validation", () => {
  describe("validateBio", () => {
    it("returns null for empty bio", () => {
      expect(validateBio("")).toBeNull();
      expect(validateBio("   ")).toBeNull();
    });

    it("returns null for valid length bio", () => {
      expect(validateBio("Hola, soy estudiante.")).toBeNull();
      expect(validateBio("a".repeat(160))).toBeNull();
    });

    it("returns error for too long bio", () => {
      expect(validateBio("a".repeat(161))).toBe("La bio no puede superar los 160 caracteres.");
    });
  });

  describe("validateAvatarFile", () => {
    it("returns null for null file", () => {
      expect(validateAvatarFile(null)).toBeNull();
    });

    it("returns error for invalid type", () => {
      const file = new File(["a"], "test.gif", { type: "image/gif" });
      expect(validateAvatarFile(file)).toBe("La foto debe ser un archivo PNG o JPG.");
    });

    it("returns error for too large file", () => {
      const file = new File(["a".repeat(5 * 1024 * 1024 + 1)], "test.jpg", { type: "image/jpeg" });
      expect(validateAvatarFile(file)).toBe("La foto no puede superar los 5 MB.");
    });

    it("returns null for valid file", () => {
      const file = new File(["a"], "test.png", { type: "image/png" });
      expect(validateAvatarFile(file)).toBeNull();
    });
  });

  describe("validateUpdateProfile", () => {
    it("returns success for valid data", () => {
      const fd = new FormData();
      fd.append("givenName", "Ana");
      fd.append("familyName", "García");
      fd.append("email", "ana@correo.com");
      fd.append("bio", "Bio.");
      
      const res = validateUpdateProfile(fd);
      expect(res.success).toBe(true);
      expect(res.errors).toEqual({});
    });

    it("returns errors for invalid data", () => {
      const fd = new FormData();
      fd.append("givenName", "");
      fd.append("familyName", "a"); // too short
      fd.append("email", "invalid");
      fd.append("bio", "a".repeat(161));
      
      const res = validateUpdateProfile(fd);
      expect(res.success).toBe(false);
      expect(res.errors.givenName).toBe("Escribe tu nombre.");
      expect(res.errors.familyName).toBe("El apellido debe tener entre 2 y 100 caracteres.");
      expect(res.errors.email).toBe("Escribe un correo válido, por ejemplo nombre@correo.com.");
      expect(res.errors.bio).toBe("La bio no puede superar los 160 caracteres.");
    });
  });

  describe("validateChangePassword", () => {
    it("returns success for valid data", () => {
      const fd = new FormData();
      fd.append("currentPassword", "old12345");
      fd.append("newPassword", "new123456");
      fd.append("confirmPassword", "new123456");
      
      const res = validateChangePassword(fd);
      expect(res.success).toBe(true);
      expect(res.errors).toEqual({});
    });

    it("returns errors for invalid formats", () => {
      const fd = new FormData();
      fd.append("currentPassword", "");
      fd.append("newPassword", "short");
      fd.append("confirmPassword", "");
      
      const res = validateChangePassword(fd);
      expect(res.success).toBe(false);
      expect(res.errors.currentPassword).toBe("Escribe tu contraseña actual.");
      expect(res.errors.newPassword).toBe("La contraseña debe tener al menos 8 caracteres.");
    });

    it("returns error for mismatched passwords", () => {
      const fd = new FormData();
      fd.append("currentPassword", "old12345");
      fd.append("newPassword", "new123456");
      fd.append("confirmPassword", "different");
      
      const res = validateChangePassword(fd);
      expect(res.success).toBe(false);
      expect(res.errors.confirmPassword).toBe("Las contraseñas no coinciden.");
    });

    it("returns error for new password same as current", () => {
      const fd = new FormData();
      fd.append("currentPassword", "same1234");
      fd.append("newPassword", "same1234");
      fd.append("confirmPassword", "same1234");
      
      const res = validateChangePassword(fd);
      expect(res.success).toBe(false);
      expect(res.errors.newPassword).toBe("La nueva contraseña debe ser distinta de la actual.");
    });
  });
});
