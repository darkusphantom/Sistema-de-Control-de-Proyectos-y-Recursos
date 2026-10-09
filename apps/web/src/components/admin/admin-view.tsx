"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session/session-provider";
import { mockUsers } from "@/data/users";
import { mockPosts } from "@/data/posts";
import { ShieldIcon } from "@/components/ui/icons";
import { AdminUsersSection } from "./admin-users-section";
import { AdminPostsSection } from "./admin-posts-section";
import type { User, UserRole, Post, PostVisibility } from "@/lib/types";

/**
 * Admin Dashboard view component for role assignment and content moderation.
 *
 * Design spec (`docs/design/wireframes_admin.md`):
 * - Restricted to `admin` role; redirects non-admin users to `/feed`.
 * - Interactive user management table with role assignment (estudiante, profesor, admin).
 * - Publication moderation table with visibility toggling (publicado, oculto).
 *
 * @returns The admin section dashboard view.
 */
export function AdminView() {
  const router = useRouter();
  const { session, status } = useSession();

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [notice, setNotice] = useState<string | null>(null);

  const isAdmin = session?.user.role === "admin";

  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      router.replace("/feed");
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

  const handlePostVisibilityChange = (postId: string, newVisibility: PostVisibility) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, visibility: newVisibility } : p)),
    );
    const targetPost = posts.find((p) => p.id === postId);
    setNotice(
      `"${targetPost?.title}" ahora es ${newVisibility}.`,
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
              Gestión de usuarios, asignación de roles y moderación de contenido.
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
      <AdminPostsSection posts={posts} onChangeVisibility={handlePostVisibilityChange} />
    </div>
  );
}
