import type { Session } from "../../domain/session";
import type { User, UserRepository } from "../../domain/user";
import { NotFoundError } from "../errors";

/** Dependencias del caso de uso de perfil de usuario. */
export type GetProfileDeps = {
  users: UserRepository;
};

/**
 * Crea el caso de uso de perfil público (R18).
 *
 * Devuelve el usuario en forma wire. El email de un perfil AJENO se redacta a
 * `""` (salvo que el llamante sea el propio usuario o un admin). Username
 * inexistente → 404 genérico (anti-enumeración).
 *
 * @param deps - Puerto de usuarios.
 * @returns Caso de uso `(username, session) → { user }`.
 */
export function getProfile(deps: GetProfileDeps) {
  return async (
    username: string,
    session: Session,
  ): Promise<{ user: User }> => {
    const user = await deps.users.findByUsername(username);
    if (!user) throw new NotFoundError();
    const isOwner = user.id === session.user.id;
    const isAdmin = session.user.role === "admin_sistema";
    const profile = isOwner || isAdmin ? user : { ...user, email: "" };
    return { user: profile };
  };
}
