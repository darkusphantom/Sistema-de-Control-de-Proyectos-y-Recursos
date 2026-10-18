/**
 * Validates a username input.
 * @param value The username string to validate.
 * @returns An error message string if invalid, or null if valid.
 */
export function validateUsername(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Escribe tu usuario.";
  if (trimmed.length > 50) return "El usuario debe tener como máximo 50 caracteres.";
  return null;
}

/**
 * Validates a person's name (given name or family name).
 * @param value The name string to validate.
 * @param isSurname Whether this is a family name (changes the error messages).
 * @returns An error message string if invalid, or null if valid.
 */
export function validateName(value: string, isSurname: boolean = false): string | null {
  const trimmed = value.trim();
  const label = isSurname ? "apellido" : "nombre";
  if (!trimmed) return `Escribe tu ${label}.`;
  if (trimmed.length < 2 || trimmed.length > 100) return `El ${label} debe tener entre 2 y 100 caracteres.`;
  // Letras con acentos, espacio, '-' y '\''
  if (!/^[\p{L}\s\-']+$/u.test(trimmed)) return `El ${label} debe tener entre 2 y 100 caracteres.`;
  return null;
}

/**
 * Validates an email address.
 * @param value The email string to validate.
 * @returns An error message string if invalid, or null if valid.
 */
export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Escribe tu correo.";
  if (trimmed.length > 254) return "El correo electrónico debe tener como máximo 254 caracteres.";
  
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return "Escribe un correo válido, por ejemplo nombre@correo.com.";
  
  return null;
}

/**
 * Validates a password input, with different rules for login vs registration.
 * @param value The password string to validate.
 * @param isLogin Whether this validation is for login (skips complexity checks).
 * @returns An error message string if invalid, or null if valid.
 */
export function validatePassword(value: string, isLogin: boolean = false): string | null {
  if (!value) return "Escribe tu contraseña.";
  if (isLogin) {
    if (value.length > 100) return "La contraseña debe tener como máximo 100 caracteres.";
    return null;
  }
  // Register rules
  if (value.length < 8 || value.length > 100) return "La contraseña debe tener entre 8 y 100 caracteres.";
  return null;
}

/**
 * Validates that a password confirmation matches the original password.
 * @param password The original password string.
 * @param confirm The confirmation password string.
 * @returns An error message string if invalid, or null if valid.
 */
export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return "Escribe la contraseña otra vez.";
  if (confirm.length > 100) return "La confirmación debe tener como máximo 100 caracteres.";
  if (password !== confirm) return "Las contraseñas no coinciden.";
  return null;
}

/**
 * Validates the entire login form data.
 * @param data The FormData object containing login fields.
 * @returns An object containing a success boolean and a record of field errors.
 */
export function validateLogin(data: FormData): { success: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  const username = data.get("username")?.toString() || "";
  const password = data.get("password")?.toString() || "";

  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;

  const passwordError = validatePassword(password, true);
  if (passwordError) errors.password = passwordError;

  return {
    success: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates the entire registration form data.
 * @param data The FormData object containing registration fields.
 * @returns An object containing a success boolean and a record of field errors.
 */
export function validateRegister(data: FormData): { success: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  const givenName = data.get("given-name")?.toString() || "";
  const familyName = data.get("family-name")?.toString() || "";
  const email = data.get("email")?.toString() || "";
  const newPassword = data.get("new-password")?.toString() || "";
  const confirmPassword = data.get("confirm-password")?.toString() || ""; // Usually we name it confirm-password in UI

  const givenNameError = validateName(givenName, false);
  if (givenNameError) errors["given-name"] = givenNameError;

  const familyNameError = validateName(familyName, true);
  if (familyNameError) errors["family-name"] = familyNameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(newPassword, false);
  if (passwordError) errors["new-password"] = passwordError;

  const confirmError = validateConfirmPassword(newPassword, confirmPassword);
  if (confirmError) errors["confirm-password"] = confirmError;

  return {
    success: Object.keys(errors).length === 0,
    errors,
  };
}
