import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminPostsSection } from "./admin-posts-section";
import type { Post } from "@/lib/types";

describe("AdminPostsSection", () => {
  const mockPosts: Post[] = [
    {
      id: "p-1",
      title: "Publicado 1",
      content: "Content",
      type: "articulo",
      category: "matematicas",
      researchArea: "aprendizaje-automatico",
      authorId: "u-1",
      visibility: "publicado",
      createdAt: "2026-09-01T10:00:00Z",
      publishedAt: "2026-09-01T10:00:00Z",
      updatedAt: "2026-09-01T10:00:00Z",
      imageUrl: "https://example.com/image.jpg",
    },
    {
      id: "p-2",
      title: "Oculto 1",
      content: "Content",
      type: "articulo",
      category: "matematicas",
      researchArea: "aprendizaje-automatico",
      authorId: "u-1",
      visibility: "oculto",
      createdAt: "2026-09-01T10:00:00Z",
      publishedAt: "2026-09-01T10:00:00Z",
      updatedAt: "2026-09-01T10:00:00Z",
      imageUrl: "https://example.com/image.jpg",
    },
    {
      id: "p-3",
      title: "Borrador 1",
      content: "Content",
      type: "articulo",
      category: "matematicas",
      researchArea: "aprendizaje-automatico",
      authorId: "u-1",
      visibility: "borrador",
      createdAt: "2026-09-01T10:00:00Z",
      publishedAt: "2026-09-01T10:00:00Z",
      updatedAt: "2026-09-01T10:00:00Z",
      imageUrl: "https://example.com/image.jpg",
    },
  ];

  it("renders only moderable posts (excludes 'borrador')", () => {
    render(<AdminPostsSection posts={mockPosts} onChangeVisibility={vi.fn()} />);

    expect(screen.getByText("Moderación de publicaciones (2)")).toBeDefined();
    expect(screen.getByText("Publicado 1")).toBeDefined();
    expect(screen.getByText("Oculto 1")).toBeDefined();
    expect(screen.queryByText("Borrador 1")).toBeNull();
  });

  it("shows empty state if no moderable posts", () => {
    const onlyDrafts: Post[] = [mockPosts[2]];
    render(<AdminPostsSection posts={onlyDrafts} onChangeVisibility={vi.fn()} />);

    expect(screen.getByText("No hay publicaciones para moderar.")).toBeDefined();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("calls onChangeVisibility when toggle is clicked", async () => {
    const userEventSetup = userEvent.setup();
    const handleChangeVisibility = vi.fn();
    render(<AdminPostsSection posts={mockPosts} onChangeVisibility={handleChangeVisibility} />);

    const button = screen.getByRole("button", { name: 'Ocultar "Publicado 1"' });
    await userEventSetup.click(button);

    expect(handleChangeVisibility).toHaveBeenCalledWith("p-1", "oculto");
  });
});
