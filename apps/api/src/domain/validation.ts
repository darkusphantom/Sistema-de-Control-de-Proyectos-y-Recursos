/**
 * Re-exportaciones de esquemas de validación Zod desde `@redfacyt/shared`.
 *
 * Shim de compatibilidad: todos los imports existentes en `apps/api`
 * que apuntan a `../domain/validation` continúan funcionando sin modificaciones.
 *
 * @module domain/validation
 */

export {
  // Schemas de autenticación
  emailSchema,
  passwordRegisterSchema,
  passwordLoginSchema,
  nameSchema,
  usernameSchema,
  idSchema,
  RegisterSchema,
  LoginSchema,
  sessionSchema,
  userSchema,
  SetUserRoleSchema,
  // Esquemas de usuario
  userOptionSchema,
} from "@redfacyt/shared";