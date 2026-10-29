import { z } from "zod";

/**
 * Esquemas Zod de autenticación — fuente de verdad para web y API.
 * Basados en `docs/design/auth.md` §4 y api-structure.md §9.1.
 */

/** Letras (incl. acentos), espacio, guion y apóstrofo para nombres propios. */
const NAME_RE = /^[\p{L}' -]+$/u;

/** Correo: trim, normalizado a minúsculas, máx. 254 (auth.md §4). */
export const emailSchema = z.string().trim().toLowerCase().email().max(254);

/** Contraseña de registro: 8–128, SIN trim (los espacios son válidos). */
export const passwordRegisterSchema = z.string().min(8).max(128);

/** Contraseña de login: 1–128 (sin min-8 para no revelar la política). */
export const passwordLoginSchema = z.string().min(1).max(128);

/** Nombre/apellido: trim, 2–60, solo letras, espacio, `-` y `'`. */
export const nameSchema = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .regex(NAME_RE, "invalid_name");

/** Username: minúsculas, dígitos, `.`, `_` y `-`; máx. 50. */
export const usernameSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9._-]+$/, "invalid_username");

/** Id de recurso (post, usuario). */
export const idSchema = z.string().min(1).max(64);

/**
 * Cuerpo de registro público (R12): el rol no es aceptable aquí; cualquier
 * campo extra (p. ej. `role`) se descarta por el parseo de zod.
 */
export const RegisterSchema = z.object({
  givenName: nameSchema,
  familyName: nameSchema,
  email: emailSchema,
  password: passwordRegisterSchema,
});

/** Cuerpo de login (R13): username + contraseña. */
export const LoginSchema = z.object({
  username: usernameSchema,
  password: passwordLoginSchema,
});

/** `Session` wire: sesión activa. */
export const sessionSchema = z
  .object({
    user: z.object({
      id: z.string(),
      username: z.string(),
      role: z.enum(["coordinador", "aprobador", "admin_sistema"] as const),
    }),
    expiresAt: z.string(),
  })
  .strict();

/** `User` wire: usuario registrado. */
export const userSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    givenName: z.string(),
    familyName: z.string(),
    role: z.enum(["coordinador", "aprobador", "admin_sistema"] as const),
    createdAt: z.string(),
    bio: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
  })
  .strict();

/**
 * Cuerpo de asignación de rol por admin del sistema.
 *
 * `admin_sistema` queda fuera del enum de destino: el alta y la baja de
 * administradores es **operativa** (seed del ambiente), no una transición de
 * esta API (decisiones D5/D6 de `wireframes_admin.md`). Con ello el endpoint
 * no puede crear administradores.
 */
export const SetUserRoleSchema = z.object({
  role: z.enum(["coordinador", "aprobador"] as const),
});
