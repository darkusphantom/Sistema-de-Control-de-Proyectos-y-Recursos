/**
 * @redfacyt/shared — Fuente de verdad del monorepo Red FaCyT.
 *
 * Exporta en orden:
 * 1. Taxonomía (enums de valores)
 * 2. Tipos de dominio
 * 3. Esquemas Zod
 * 4. Lógica de dominio puro
 */

// ─── Tipos de dominio ─────────────────────────────────────────────────────────

export type {
  UserRole,
  User,
  UserOption,
} from "./types/user";

export type { Session } from "./types/session";

export type { Page } from "./types/pagination";

// ─── Esquemas Zod ─────────────────────────────────────────────────────────────

export {
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
} from "./schemas/auth";

export {
  bioSchema,
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  avatarFileSchema,
  AVATAR_DATA_URL_MAX_CHARS,
  avatarDataUrlSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
  userOptionSchema,
} from "./schemas/user";
