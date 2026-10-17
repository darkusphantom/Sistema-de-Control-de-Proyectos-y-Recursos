/**
 * Roles posibles de un usuario de la plataforma Red FaCyT.
 *
 * Tras el pivot a Control de Proyectos (pivot-project.md §7): el registro
 * público solo crea `coordinador`; `aprobador` gestiona inventario y
 * aprobaciones; `admin_sistema` tiene acceso total (usuarios, catálogos,
 * auditoría).
 */
export type UserRole = "coordinador" | "aprobador" | "admin_sistema";

/**
 * Usuario registrado en el sistema.
 */
export type User = {
  id: string;
  username: string;
  email: string;
  givenName: string;
  familyName: string;
  role: UserRole;
  createdAt: string;
  /** Breve presentación personal, máx. 160 caracteres. `null` = sin bio. */
  bio?: string | null;
  /**
   * Foto de perfil. `null` = sin foto (se usan las iniciales).
   * Solo admite data URL validado (fase estática) o ruta relativa `/uploads/…`
   * (futuro). Nunca una URL absoluta externa (§2.9).
   */
  avatarUrl?: string | null;
};

/**
 * Datos ligeros de usuario para listados y selectores (sin email ni rol).
 */
export type UserOption = {
  id: string;
  username: string;
  /** Nombre completo para mostrar, p. ej. "María Rivas". */
  fullName: string;
};
