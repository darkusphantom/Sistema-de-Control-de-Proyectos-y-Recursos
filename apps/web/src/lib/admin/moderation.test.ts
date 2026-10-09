import { describe, it, expect } from "vitest";
import { listModerablePosts, canChangeRole } from "./moderation";
import type { Post } from "@/lib/types";

describe("moderation domain logic", () => {
  describe("listModerablePosts", () => {
    it("excludes 'borrador' posts from the list", () => {
      const posts: Partial<Post>[] = [
        { id: "1", visibility: "publicado" },
        { id: "2", visibility: "borrador" },
        { id: "3", visibility: "oculto" },
        { id: "4", visibility: "publicado" },
      ];

      const result = listModerablePosts(posts as Post[]);

      expect(result).toHaveLength(3);
      expect(result.some((p) => p.visibility === "borrador")).toBe(false);
      expect(result.map((p) => p.id)).toEqual(["1", "3", "4"]);
    });

    it("returns empty array if all posts are 'borrador'", () => {
      const posts: Partial<Post>[] = [
        { id: "1", visibility: "borrador" },
        { id: "2", visibility: "borrador" },
      ];

      const result = listModerablePosts(posts as Post[]);

      expect(result).toHaveLength(0);
    });

    it("returns all posts if none are 'borrador'", () => {
      const posts: Partial<Post>[] = [
        { id: "1", visibility: "publicado" },
        { id: "2", visibility: "oculto" },
      ];

      const result = listModerablePosts(posts as Post[]);

      expect(result).toHaveLength(2);
    });
  });

  describe("canChangeRole", () => {
    it("returns false for 'admin' role", () => {
      expect(canChangeRole("admin")).toBe(false);
    });

    it("returns true for 'estudiante' role", () => {
      expect(canChangeRole("estudiante")).toBe(true);
    });

    it("returns true for 'profesor' role", () => {
      expect(canChangeRole("profesor")).toBe(true);
    });
  });
});
