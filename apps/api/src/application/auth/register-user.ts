import { APIError } from "better-auth";
import type { AppAuth } from "../../infrastructure/auth/auth.config";
import type { Session } from "../../domain/session";
import type { User, UserRepository } from "../../domain/user";
import { ConflictError } from "../errors";
import { verifyPasswordDecoy } from "./password-decoy";
import {
  requestHeadersFromSetCookies,
  requireCurrentSession,
} from "./session";

/** Cuerpo del registro público (R12): solo nombre, apellido, email y password. */
export type RegisterUserCommand = {
  givenName: string;
  familyName: string;
  email: string;
  password: string;
};

/** Resultado del registro: sesión wire + usuario creado + cookies a aplicar. */
export type RegisterUserResult = {
  session: Session;
  user: User;
  setCookies: string[];
};

/** Longitud máxima del username derivado (contrato `usernameSchema`, QA-2). */
export const MAX_USERNAME_LENGTH = 50;

/** Status que Better Auth v1.7.7 usa para cuentas duplicadas en sign-up. */
const DUPLICATE_ACCOUNT_STATUS = 422;

/**
 * Recorta un username base para que quepa en el límite del contrato.
 *
 * Si `base` excede 50 caracteres, se trunca de forma determinista por la
 * derecha y se eliminan separadores (`._-`) finales que queden cortados, de
 * modo que el resultado sigue siendo un username válido (QA-2).
 *
 * @param base - Username base derivado de `givenName.familyName`.
 * @returns Username base recortado a ≤ 50 caracteres.
 */
export function clampUsernameBase(base: string): string {
  if (base.length <= MAX_USERNAME_LENGTH) return base;
  const clamped = base.slice(0, MAX_USERNAME_LENGTH).replace(/[._-]+$/, "");
  return clamped.length > 0 ? clamped : "u";
}

/**
 * Generador determinista de username a partir de nombre y apellido:
 * `givenName.familyName` en minúsculas y sin diacríticos.
 *
 * @param givenName  - Nombre.
 * @param familyName - Apellido.
 * @returns Username base (sin garantía de unicidad; ver `ensureUniqueUsername`).
 */
export type UsernameGenerator = (givenName: string, familyName: string) => string;

/** Generador por defecto: `maria.rivas`, `jose.luis.ramirez`, etc. */
export const defaultUsernameGenerator: UsernameGenerator = (
  givenName,
  familyName,
) => {
  const normalize = (value: string): string =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9._-]/g, "");
  const base = `${normalize(givenName)}.${normalize(familyName)}`;
  return clampUsernameBase(base);
};

/**
 * Resuelve un username único añadiendo un sufijo numérico creciente si el base
 * ya está ocupado (`j.rivas`, `j.rivas1`, `j.rivas2`...). El sufijo nunca
 * empuja el resultado por encima de `MAX_USERNAME_LENGTH`: el base se recorta
 * para reservar espacio al sufijo.
 *
 * Nota: en memoria el chequeo + inserción no es atómico; la carrera entre dos
 * registros simultáneos con el mismo nombre se cierra en PostgreSQL con índices
 * únicos sobre `lower(username)` (limitación aceptada del MVP).
 *
 * @param users - Puerto de usuarios.
 * @param base  - Username base determinista (ya ≤ 50).
 * @returns Username único dentro del contrato.
 */
export async function ensureUniqueUsername(
  users: UserRepository,
  base: string,
): Promise<string> {
  let candidate = base;
  let suffix = 1;
  while (await users.findByUsername(candidate)) {
    const suffixText = String(suffix);
    const maxBaseLength = MAX_USERNAME_LENGTH - suffixText.length;
    const basePart =
      base.length <= maxBaseLength
        ? base
        : base.slice(0, maxBaseLength).replace(/[._-]+$/, "") || "u";
    candidate = `${basePart}${suffixText}`;
    suffix += 1;
  }
  return candidate;
}

/**
 * Crea el caso de uso de registro (R12).
 *
 * El registro NO recibe el username del cliente: se deriva de
 * `givenName`/`familyName` (recortado a ≤ 50, QA-2). Un conflicto de `email`
 * o de `username` derivado produce el MISMO `409` genérico (anti-enumeración);
 * cualquier otro error (no conflicto) propaga al error handler (500 genérico
 * sin fuga, QA-1). El rol enviado en el body se ignora (el usuario nace
 * `coordinador`).
 *
 * Anti-enumeración por timing (H5): cuando el email ya existe se ejecuta
 * también una derivación Scrypt señuelo antes de responder 409, de modo que
 * el coste temporal es similar al de un registro real.
 *
 * @param deps - Instancia de Better Auth y puerto de usuarios.
 * @returns Caso de uso `(command, headers) → RegisterUserResult`.
 */
export function createRegisterUser(deps: {
  auth: AppAuth;
  users: UserRepository;
  generateUsername?: UsernameGenerator;
}) {
  const generateUsername = deps.generateUsername ?? defaultUsernameGenerator;
  return async (
    command: RegisterUserCommand,
    headers: HeadersInit,
  ): Promise<RegisterUserResult> => {
    const existingByEmail = await deps.users.findByEmail(command.email);
    if (existingByEmail) {
      // Iguala el coste temporal del hasheo real (misma derivación Scrypt).
      await verifyPasswordDecoy(command.password);
      throw new ConflictError(
        "No pudimos crear la cuenta. Intenta de nuevo.",
        "account_conflict",
      );
    }
    const base = generateUsername(command.givenName, command.familyName);
    const username = await ensureUniqueUsername(deps.users, base);
    try {
      const result = await deps.auth.api.signUpEmail({
        body: {
          name: `${command.givenName} ${command.familyName}`,
          email: command.email,
          password: command.password,
          username,
          givenName: command.givenName,
          familyName: command.familyName,
        },
        headers,
        returnHeaders: true,
        returnStatus: true,
      });
      const session = await requireCurrentSession(
        deps.auth,
        deps.users,
        requestHeadersFromSetCookies(result.headers.getSetCookie()),
      );
      const user = (await deps.users.findById(session.user.id)) as User;
      return {
        session,
        user,
        setCookies: result.headers.getSetCookie(),
      };
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      // Solo un conflicto real (email/username duplicado) es 409; el resto
      // propaga al error handler para un 500 genérico sin fuga (QA-1).
      if (error instanceof APIError && error.statusCode === DUPLICATE_ACCOUNT_STATUS) {
        throw new ConflictError(
          "No pudimos crear la cuenta. Intenta de nuevo.",
          "account_conflict",
        );
      }
      throw error;
    }
  };
}