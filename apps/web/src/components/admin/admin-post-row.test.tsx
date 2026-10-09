import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminPostRow } from "./admin-post-row";
import type { Post } from "@/lib/types";

describe("AdminPostRow", () => {
  const mockPost: Post = {
    id: "p-1",
    title: "Test Post",
    content: "Content",
    type: "articulo",
    authorId: "u-1",
    category: "matematicas",
    researchArea: "aprendizaje-automatico",
    visibility: "publicado",
    createdAt: "2026-09-01T10:00:00Z",
    publishedAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
    imageUrl: "https://example.com/image.jpg",
  };

  it("renders correctly for 'publicado' post", () => {
    render(
      <table>
        <tbody>
          <AdminPostRow post={mockPost} onChangeVisibility={vi.fn()} />
        </tbody>
      </table>
    );

    expect(screen.getByText("Test Post")).toBeDefined();
    expect(screen.getByText("matematicas")).toBeDefined();
    expect(screen.getByText("publicado")).toBeDefined();
    expect(screen.getByRole("button", { name: 'Ocultar "Test Post"' })).toBeDefined();
  });

  it("renders correctly for 'oculto' post", () => {
    const hiddenPost: Post = { ...mockPost, visibility: "oculto" };
    render(
      <table>
        <tbody>
          <AdminPostRow post={hiddenPost} onChangeVisibility={vi.fn()} />
        </tbody>
      </table>
    );

    expect(screen.getByText("oculto")).toBeDefined();
    expect(screen.getByRole("button", { name: 'Mostrar "Test Post"' })).toBeDefined();
  });

  it("calls onChangeVisibility when toggle button is clicked", async () => {
    const userEventSetup = userEvent.setup();
    const handleChangeVisibility = vi.fn();
    render(
      <table>
        <tbody>
          <AdminPostRow post={mockPost} onChangeVisibility={handleChangeVisibility} />
        </tbody>
      </table>
    );

    const button = screen.getByRole("button", { name: 'Ocultar "Test Post"' });
    await userEventSetup.click(button);

    expect(handleChangeVisibility).toHaveBeenCalledWith("p-1", "oculto");
  });
});
