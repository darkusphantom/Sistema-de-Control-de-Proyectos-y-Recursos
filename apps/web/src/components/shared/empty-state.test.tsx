import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="Todavía no has publicado nada" />);
    expect(screen.getByRole("heading", { name: /todavía no has publicado/i })).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(
      <EmptyState title="Sin resultados" description="Prueba con otros filtros." />,
    );
    expect(screen.getByText("Prueba con otros filtros.")).toBeInTheDocument();
  });

  it("renders a link when action.href is provided", () => {
    render(
      <EmptyState
        title="Sin publicaciones"
        action={{ label: "Ir al dashboard", href: "/dashboard" }}
      />,
    );
    const link = screen.getByRole("link", { name: "Ir al dashboard" });
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("renders a button when action.onClick is provided", async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Sin resultados"
        action={{ label: "Limpiar filtros", onClick }}
      />,
    );
    const btn = screen.getByRole("button", { name: "Limpiar filtros" });
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders nothing for action when action is undefined", () => {
    render(<EmptyState title="Sin publicaciones" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
