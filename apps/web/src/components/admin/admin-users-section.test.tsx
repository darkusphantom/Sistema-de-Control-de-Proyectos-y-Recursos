import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsersSection } from "./admin-users-section";
import type { User } from "@/lib/types";

describe("AdminUsersSection", () => {
  const mockUsers: User[] = [
    {
      id: "u-1",
      username: "admin",
      email: "admin@facyt.edu",
      givenName: "Admin",
      familyName: "Sistema",
      role: "admin",
      createdAt: "2026-09-01T10:00:00Z",
    },
    {
      id: "u-2",
      username: "l.rodriguez",
      email: "l.rodriguez@facyt.edu",
      givenName: "Luis",
      familyName: "Rodríguez",
      role: "estudiante",
      createdAt: "2026-09-02T10:00:00Z",
    },
  ];

  it("renders the list of users", () => {
    render(<AdminUsersSection users={mockUsers} onChangeRole={vi.fn()} />);

    expect(screen.getByText("Gestión de usuarios (2)")).toBeDefined();
    expect(screen.getByText("Luis Rodríguez")).toBeDefined();
    expect(screen.getByText("Admin Sistema")).toBeDefined();
  });

  it("filters users by search query", async () => {
    const userEventSetup = userEvent.setup();
    render(<AdminUsersSection users={mockUsers} onChangeRole={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText("Buscar por nombre o usuario…");
    await userEventSetup.type(searchInput, "Luis");

    expect(screen.getByText("Luis Rodríguez")).toBeDefined();
    expect(screen.queryByText("Admin Sistema")).toBeNull();
  });

  it("shows empty state when no users match search", async () => {
    const userEventSetup = userEvent.setup();
    render(<AdminUsersSection users={mockUsers} onChangeRole={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText("Buscar por nombre o usuario…");
    await userEventSetup.type(searchInput, "NonExistentUser123");

    expect(screen.getByText("Ningún usuario coincide con la búsqueda.")).toBeDefined();
  });

  it("opens confirmation dialog when role is changed and calls onChangeRole on confirm", async () => {
    const userEventSetup = userEvent.setup();
    const handleChangeRole = vi.fn();
    render(<AdminUsersSection users={mockUsers} onChangeRole={handleChangeRole} />);

    // Change Luis's role to profesor
    const select = screen.getByRole("combobox", { name: "Cambiar rol de @l.rodriguez" });
    await userEventSetup.selectOptions(select, "profesor");

    // Dialog should open
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText('¿Cambiar el rol de @l.rodriguez de "estudiante" a "profesor"?')).toBeDefined();

    // Confirm
    const confirmButton = screen.getByRole("button", { name: "Confirmar" });
    await userEventSetup.click(confirmButton);

    expect(handleChangeRole).toHaveBeenCalledWith("u-2", "profesor");
    expect(screen.queryByRole("dialog")).toBeNull(); // Dialog closes
  });

  it("does not call onChangeRole on dialog cancel", async () => {
    const userEventSetup = userEvent.setup();
    const handleChangeRole = vi.fn();
    render(<AdminUsersSection users={mockUsers} onChangeRole={handleChangeRole} />);

    // Change Luis's role to profesor
    const select = screen.getByRole("combobox", { name: "Cambiar rol de @l.rodriguez" });
    await userEventSetup.selectOptions(select, "profesor");

    // Cancel
    const cancelButton = screen.getByRole("button", { name: "Cancelar" });
    await userEventSetup.click(cancelButton);

    expect(handleChangeRole).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull(); // Dialog closes
  });
});
