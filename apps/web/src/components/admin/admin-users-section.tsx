"use client";

import { useState } from "react";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminUserRow } from "./admin-user-row";
import { ConfirmRoleDialog } from "./confirm-role-dialog";
import { UserIcon } from "@/components/ui/icons";
import type { User, UserRole } from "@/lib/types";

export type AdminUsersSectionProps = {
  users: User[];
  onChangeRole: (userId: string, newRole: UserRole) => void;
};

export function AdminUsersSection({ users, onChangeRole }: AdminUsersSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    user: User | null;
    newRole: UserRole | null;
  }>({
    isOpen: false,
    user: null,
    newRole: null,
  });

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      u.username.toLowerCase().includes(query) ||
      `${u.givenName} ${u.familyName}`.toLowerCase().includes(query)
    );
  });

  const handleRoleChangeRequest = (userId: string, newRole: UserRole) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    // Si el rol es el mismo, no hacemos nada
    if (user.role === newRole) return;

    setDialogState({
      isOpen: true,
      user,
      newRole,
    });
  };

  const handleConfirmRoleChange = () => {
    if (dialogState.user && dialogState.newRole) {
      onChangeRole(dialogState.user.id, dialogState.newRole);
    }
    setDialogState({ isOpen: false, user: null, newRole: null });
  };

  const handleCancelRoleChange = () => {
    setDialogState({ isOpen: false, user: null, newRole: null });
  };

  return (
    <section aria-labelledby="user-mgmt-heading" className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 id="user-mgmt-heading" className="font-display text-h3 text-text">
            Gestión de usuarios ({users.length})
          </h2>
          <p className="text-xs text-text-muted">
            Asigna roles a los miembros registrados en la plataforma.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Field
            label="Buscar usuarios"
            name="searchUsers"
            placeholder="Buscar por nombre o usuario…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={<UserIcon className="h-12 w-12" />}
          title={users.length === 0 ? "Aún no hay usuarios registrados." : "Ningún usuario coincide con la búsqueda."}
          description={users.length === 0 ? "Los usuarios aparecerán aquí cuando se registren." : `No se encontraron resultados para «${searchQuery}».`}
        />
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg bg-surface shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <caption className="sr-only">Lista de usuarios para asignación de roles</caption>
            <thead className="bg-surface-muted text-text-muted font-medium border-b border-border">
              <tr>
                <th scope="col" className="px-4 py-3">Usuario</th>
                <th scope="col" className="px-4 py-3">Rol actual</th>
                <th scope="col" className="px-4 py-3">Registro</th>
                <th scope="col" className="px-4 py-3 text-right">Cambiar rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <AdminUserRow
                  key={user.id}
                  user={user}
                  onChangeRole={handleRoleChangeRequest}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogState.user && dialogState.newRole && (
        <ConfirmRoleDialog
          open={dialogState.isOpen}
          onClose={handleCancelRoleChange}
          onConfirm={handleConfirmRoleChange}
          username={dialogState.user.username}
          currentRole={dialogState.user.role}
          newRole={dialogState.newRole}
        />
      )}
    </section>
  );
}
