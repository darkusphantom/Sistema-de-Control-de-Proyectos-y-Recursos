"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session/session-provider";
import { mockUsers } from "@/data/users";
import { ShieldIcon } from "@/components/ui/icons";
import { AdminUsersSection } from "./admin-users-section";
import type { User, UserRole } from "@/lib/types";

/**
 * Vista del panel de administración para la asignación de roles.
 *
 * Especificación de diseño (`docs/design/wireframes_admin.md`):
 * - Restringida al rol `admin_sistema`; redirige al resto a `/dashboard`.
 * - Tabla interactiva de gestión de usuarios con asignación de rol.
 *
 * Nota: la sección de moderación de publicaciones se eliminó en el pivot de
 * Red FaCyT; la gestión de catálogos, usuarios y auditoría la sustituirá.
 *
 * @returns La vista del panel de administración.
 */
export function AdminView() {
  const router = useRouter();
  const { session, status } = useSession();

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [notice, setNotice] = useState<string | null>(null);

  const isAdmin = session?.user.role === "admin_sistema";

  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [status, isAdmin, router]);

  if (status === "loading" || !session) {
    return (
      <div
        aria-busy="true"
        className="min-h-96 flex items-center justify-center"
        aria-label="Cargando panel de administración"
      />
    );
  }

  if (!isAdmin) {
    return null; // Will redirect via effect
  }

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
    );
    const targetUser = users.find((u) => u.id === userId);
    setNotice(
      `Rol de @${targetUser?.username ?? userId} actualizado a "${newRole}".`,
    );
  };

  return (
    <div className="flex flex-col gap-8 py-4 max-w-6xl mx-auto">
      {/* ── Admin Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-surface-muted border border-border text-primary">
            <ShieldIcon className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-h2 text-text">
              Panel de Administración
            </h1>
            <p className="text-text-muted text-sm">
              Gestión de usuarios y asignación de roles.
            </p>
          </div>
        </div>

        {notice && (
          <div
            role="status"
            aria-live="polite"
            className="bg-accent-teal/10 border border-accent-teal/30 text-accent-teal text-sm px-4 py-2 rounded-md"
          >
            {notice}
          </div>
        )}
      </div>

      <AdminUsersSection users={users} onChangeRole={handleRoleChange} />
    </div>
  );
}
