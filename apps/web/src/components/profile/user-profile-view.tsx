"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";
import { PencilIcon } from "@/components/ui/icons";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { User } from "@/lib/types";

export type UserProfileViewProps = {
  user: User;
  isOwnProfile: boolean;
};

export function UserProfileView({ user, isOwnProfile }: UserProfileViewProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleSuccess = (msg: string) => {
    setStatusMsg(msg);
    setIsEditingProfile(false);
    setIsEditingPassword(false);
    setTimeout(() => setStatusMsg(""), 5000);
  };

  const roleTone =
    user.role === "admin_sistema"
      ? "warning"
      : user.role === "aprobador"
        ? "category"
        : "neutral";

  if (isEditingProfile) {
    return (
      <div className="bg-surface p-6 rounded-xl border border-border mb-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-text">Editar Perfil</h2>
        <ProfileForm
          user={user}
          onCancel={() => setIsEditingProfile(false)}
          onSuccess={() => handleSuccess("Perfil actualizado correctamente.")}
        />
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-xl border border-border mb-8 shadow-sm">
      {statusMsg && (
        <div id="profile-status" role="status" className="mb-6 text-primary font-medium text-sm p-4 bg-surface-muted rounded-md border border-border flex items-center">
          {statusMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <Avatar user={user} size="xl" className="shadow-sm" />

        <div className="flex-1 space-y-3 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-h2 text-text">
                  {user.givenName} {user.familyName}
                </h1>
                <Badge tone={roleTone}>{user.role}</Badge>
              </div>
              <p className="text-text-muted font-medium">
                @{user.username} · {user.email}
              </p>
              <p className="text-text-muted text-xs">
                Miembro desde {formatDate(user.createdAt)}
              </p>
            </div>

            {isOwnProfile && (
              <button onClick={() => setIsEditingProfile(true)} className={buttonStyles({ variant: "secondary", className: "sm:self-start" })}>
                <PencilIcon className="mr-2 size-4 opacity-80" />
                Editar perfil
              </button>
            )}
          </div>

          {user.bio && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-text whitespace-pre-wrap leading-relaxed max-w-3xl">
                {user.bio}
              </p>
            </div>
          )}

          {isOwnProfile && !isEditingPassword && (
            <div className="pt-6 mt-6 border-t border-border">
              <button onClick={() => setIsEditingPassword(true)} className={buttonStyles({ variant: "secondary", size: "sm" })}>
                Cambiar contraseña
              </button>
            </div>
          )}

          {isEditingPassword && (
            <div className="pt-6 mt-6 border-t border-border">
              <PasswordForm
                onCancel={() => setIsEditingPassword(false)}
                onSuccess={() => handleSuccess("Contraseña actualizada correctamente.")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
