/**
 * Re-exportaciones desde `@redfacyt/shared`.
 *
 * Este archivo actúa como shim de compatibilidad: los imports existentes en
 * todo el frontend (`@/lib/types`) continúan funcionando sin modificaciones
 * mientras la fuente de verdad vive en el paquete compartido.
 *
 * @module lib/types
 */

export type {
  UserRole,
  User,
  Session,
  UserOption,
} from "@redfacyt/shared";

/**
 * Tipos utilitarios propios del frontend (no compartidos con la API).
 */

/** Errores a nivel de campo en un formulario basados en su modelo. */
export type FormErrors<T> = Partial<Record<keyof T, string>>;

/** Resultado estándar para operaciones de autenticación. */
export type AuthResult =
  | { success: true; session: import("@redfacyt/shared").Session }
  | { success: false; error: string; fieldErrors?: Record<string, string> };
