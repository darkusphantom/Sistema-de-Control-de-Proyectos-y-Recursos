import type { Post, UserRole } from "@/lib/types";

/**
 * Filtra las publicaciones devolviendo solo las que son moderables por un administrador.
 * Excluye explícitamente los borradores (borrador), ya que son material privado del autor.
 *
 * @param posts - Lista completa de publicaciones.
 * @returns Lista de publicaciones moderables (publicado u oculto).
 */
export function listModerablePosts(posts: Post[]): Post[] {
  return posts.filter((post) => post.visibility !== "borrador");
}

/**
 * Determina si el rol de un usuario puede ser cambiado.
 * Por regla de seguridad (D2 / F-01), el rol `admin` es inmutable desde la aplicación.
 *
 * @param targetRole - El rol actual del usuario al que se le intenta cambiar el rol.
 * @returns `true` si el rol puede ser cambiado, `false` si está bloqueado.
 */
export function canChangeRole(targetRole: UserRole): boolean {
  return targetRole !== "admin";
}
