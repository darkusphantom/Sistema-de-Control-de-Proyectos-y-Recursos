"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { EyeOffIcon } from "@/components/ui/icons";
import { AdminPostRow } from "./admin-post-row";
import { listModerablePosts } from "@/lib/admin/moderation";
import type { Post, PostVisibility } from "@/lib/types";

export type AdminPostsSectionProps = {
  posts: Post[];
  onChangeVisibility: (postId: string, newVisibility: PostVisibility) => void;
};

export function AdminPostsSection({ posts, onChangeVisibility }: AdminPostsSectionProps) {
  const moderablePosts = listModerablePosts(posts);

  return (
    <section aria-labelledby="post-mgmt-heading" className="flex flex-col gap-4 mt-4">
      <div>
        <h2 id="post-mgmt-heading" className="font-display text-h3 text-text">
          Moderación de publicaciones ({moderablePosts.length})
        </h2>
        <p className="text-xs text-text-muted">
          Administra la visibilidad pública de las publicaciones del sistema.
        </p>
      </div>

      {moderablePosts.length === 0 ? (
        <EmptyState
          icon={<EyeOffIcon className="h-12 w-12" />}
          title="No hay publicaciones para moderar."
          description="Las publicaciones en estado publicado u oculto aparecerán aquí."
        />
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg bg-surface shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <caption className="sr-only">Lista de publicaciones para moderación</caption>
            <thead className="bg-surface-muted text-text-muted font-medium border-b border-border">
              <tr>
                <th scope="col" className="px-4 py-3">Título</th>
                <th scope="col" className="px-4 py-3">Categoría</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {moderablePosts.map((post) => (
                <AdminPostRow
                  key={post.id}
                  post={post}
                  onChangeVisibility={onChangeVisibility}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
