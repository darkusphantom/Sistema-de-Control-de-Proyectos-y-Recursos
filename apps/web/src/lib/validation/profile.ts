import { avatarDataUrlSchema } from "@redfacyt/shared";
import { validateName, validateEmail } from "./auth";

/**
 * Validates the bio field.
 * @param value The bio string.
 * @returns Error message or null.
 */
export function validateBio(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length > 160) return "La bio no puede superar los 160 caracteres.";
  return null;
}

/**
 * Validates the file selected for avatar.
 * @param file The selected File object or null.
 * @returns Error message or null.
 */
export function validateAvatarFile(file: File | null): string | null {
  if (!file || file.size === 0) return null;
  
  const validTypes = ["image/png", "image/jpeg"];
  if (!validTypes.includes(file.type)) return "La foto debe ser un archivo PNG o JPG.";
  
  const MAX_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_BYTES) return "La foto no puede superar los 5 MB.";
  
  return null;
}

/**
 * Validates the profile update form data.
 */
export function validateUpdateProfile(data: FormData): { success: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  const givenName = data.get("givenName")?.toString() || "";
  const familyName = data.get("familyName")?.toString() || "";
  const email = data.get("email")?.toString() || "";
  const bio = data.get("bio")?.toString() || "";
  const avatarUrl = data.get("avatarUrl")?.toString() || "";
  
  const givenNameError = validateName(givenName, false);
  if (givenNameError) errors.givenName = givenNameError;
  
  const familyNameError = validateName(familyName, true);
  if (familyNameError) errors.familyName = familyNameError;
  
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  
  const bioError = validateBio(bio);
  if (bioError) errors.bio = bioError;

  // El servidor no confía en el input oculto: solo se aceptan data URLs PNG o
  // JPEG (evita almacenar URLs externas arbitrarias en el perfil).
  if (avatarUrl) {
    const parsed = avatarDataUrlSchema.safeParse(avatarUrl);
    if (!parsed.success) {
      const tooLarge = parsed.error.issues.some(
        (issue) => issue.message === "too_large",
      );
      errors.avatarUrl = tooLarge
        ? "La foto no puede superar los 5 MB."
        : "El formato de la foto no es válido.";
    }
  }
  
  return {
    success: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates the change password form data.
 */
export function validateChangePassword(data: FormData): { success: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  const currentPassword = data.get("currentPassword")?.toString() || "";
  const newPassword = data.get("newPassword")?.toString() || "";
  const confirmPassword = data.get("confirmPassword")?.toString() || "";
  
  if (!currentPassword) {
    errors.currentPassword = "Escribe tu contraseña actual.";
  }
  
  if (!newPassword || newPassword.length < 8) {
    errors.newPassword = "La contraseña debe tener al menos 8 caracteres.";
  }
  
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }
  
  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.newPassword = "La nueva contraseña debe ser distinta de la actual.";
  }
  
  return {
    success: Object.keys(errors).length === 0,
    errors,
  };
}
