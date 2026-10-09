"use client";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import type { Post, PostVisibility } from "@/lib/types";

export type AdminPostRowProps = {
  post: Post;
  onChangeVisibility: (postId: string, newVisibility: PostVisibility) => void;
};

export function AdminPostRow({ post, onChangeVisibility }: AdminPostRowProps) {
  const toggleVisibility = () => {
    const newVisibility = post.visibility === "publicado" ? "oculto" : "publicado";
    onChangeVisibility(post.id, newVisibility);
  };

  return (
    <tr className="hover:bg-surface-muted/50 transition-colors">
      <td className="px-4 py-3 font-medium text-text max-w-xs truncate" title={post.title}>
        {post.title}
      </td>
      <td className="px-4 py-3 text-text-muted capitalize">
        {post.category}
      </td>
      <td className="px-4 py-3">
        <Badge
          tone={
            post.visibility === "oculto"
              ? "warning"
              : "category"
          }
        >
          {post.visibility}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={toggleVisibility}
          className={buttonStyles({ variant: "secondary", size: "sm" })}
          aria-label={`${post.visibility === "publicado" ? "Ocultar" : "Mostrar"} "${post.title}"`}
        >
          {post.visibility === "publicado" ? "Ocultar" : "Mostrar"}
        </button>
      </td>
    </tr>
  );
}
