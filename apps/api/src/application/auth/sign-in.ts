import type { Logger } from "pino";
import type { AppAuth } from "../../infrastructure/auth/auth.config";
import type { Session } from "../../domain/session";
import type { UserRepository } from "../../domain/user";
import { InvalidCredentialsError } from "../errors";
import { verifyPasswordDecoy } from "./password-decoy";
import {
  requestHeadersFromSetCookies,
  requireCurrentSession,
} from "./session";

/** Cuerpo del login (R13): username + password. */
export type SignInCommand = {
  username: string;
  password: string;
};

/** Resultado del login: sesión wire + cookies a aplicar (cookie nueva). */
export type SignInResult = {
  session: Session;
  setCookies: string[];
};

/**
 * Crea el caso de uso de login (R13).
 *
 * Flujo: resuelve `username → email` (repo) y delega en
 * `auth.api.signInEmail`. Si el username no existe o la contraseña no
 * coincide, devuelve el MISMO `401` idéntico (hash señuelo asíncrono para
 * tiempo constante cuando el usuario no existe, H5). El error subyacente se
 * registra con el logger (sin exponerlo en el wire) para observabilidad.
 *
 * @param deps - Instancia de Better Auth, puerto de usuarios y logger opcional.
 * @returns Caso de uso `(command, headers) → SignInResult`.
 */
export function createSignInUser(deps: {
  auth: AppAuth;
  users: UserRepository;
  logger?: Pick<Logger, "warn">;
}) {
  return async (
    command: SignInCommand,
    headers: HeadersInit,
  ): Promise<SignInResult> => {
    const user = await deps.users.findByUsername(command.username);
    if (!user) {
      await verifyPasswordDecoy(command.password);
      throw new InvalidCredentialsError();
    }
    try {
      const result = await deps.auth.api.signInEmail({
        body: { email: user.email, password: command.password },
        headers,
        returnHeaders: true,
        returnStatus: true,
      });
      const session = await requireCurrentSession(
        deps.auth,
        deps.users,
        requestHeadersFromSetCookies(result.headers.getSetCookie()),
      );
      return { session, setCookies: result.headers.getSetCookie() };
    } catch (error) {
      // 401 idéntico para usuario inexistente y contraseña incorrecta (R13).
      // El detalle interno se registra en el servidor, nunca en el wire.
      const detail =
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { message: String(error) };
      // Sin username ni email: los logs no son un almacén de datos personales
      // ni deben permitir inyección de contenido en el recolector.
      deps.logger?.warn(
        { event: "login_failed", reason: "invalid_credentials", err: detail },
        "Login failed",
      );
      throw new InvalidCredentialsError();
    }
  };
}