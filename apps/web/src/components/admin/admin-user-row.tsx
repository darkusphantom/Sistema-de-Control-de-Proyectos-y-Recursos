"use client";

import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/ui/select-field";
import { formatDate } from "@/lib/format";
import { canChangeRole } from "@/lib/admin/moderation";
import type { User, UserRole } from "@/lib/types";

export type AdminUserRowProps = {
  user: User;
  onChangeRole: (userId: string, newRole: UserRole) => void;
};

export function AdminUserRow({ user, onChangeRole }: AdminUserRowProps) {
  const isRoleChangeAllowed = canChangeRole(user.role);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isRoleChangeAllowed) return; // double check
    onChangeRole(user.id, e.target.value as UserRole);
  };

  return (
    <tr className="hover:bg-surface-muted/50 transition-colors">
      <td className="px-4 py-3 font-medium text-text">
        <div className="flex flex-col">
          <span>
            {user.givenName} {user.familyName}
          </span>
          <span className="text-xs text-text-muted font-normal">
            @{user.username}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge
          tone={
            user.role === "admin_sistema"
              ? "warning"
              : user.role === "aprobador"
                ? "category"
                : "neutral"
          }
        >
          {user.role}
        </Badge>
      </td>
      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex flex-col items-end">
          <SelectField
            label=""
            name={`role-${user.id}`}
            value={user.role}
            onChange={handleRoleChange}
            disabled={!isRoleChangeAllowed}
            className="w-36 text-xs"
            aria-label={`Cambiar rol de @${user.username}`}
          >
            <option value="coordinador">coordinador</option>
            <option value="aprobador">aprobador</option>
            <option value="admin_sistema">admin_sistema</option>
          </SelectField>
          {!isRoleChangeAllowed && (
            <span className="text-[10px] text-danger mt-1">
              Los administradores del sistema no pueden cambiar de rol.
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
