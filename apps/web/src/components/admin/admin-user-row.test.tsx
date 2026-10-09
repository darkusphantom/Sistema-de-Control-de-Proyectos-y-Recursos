import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUserRow } from "./admin-user-row";
import type { User } from "@/lib/types";

describe("AdminUserRow", () => {
  const mockUser: User = {
    id: "u-1",
    username: "l.rodriguez",
    email: "l.rodriguez@facyt.edu",
    givenName: "Luis",
    familyName: "Rodríguez",
    role: "estudiante",
    createdAt: "2026-09-02T10:00:00Z",
  };

  it("renders user information correctly without email", () => {
    render(
      <table>
        <tbody>
          <AdminUserRow user={mockUser} onChangeRole={vi.fn()} />
        </tbody>
      </table>
    );

    expect(screen.getByText("Luis Rodríguez")).toBeDefined();
    expect(screen.getByText("@l.rodriguez")).toBeDefined();
    expect(screen.queryByText("l.rodriguez@facyt.edu")).toBeNull();
    expect(screen.getAllByText("estudiante")[0]).toBeDefined(); // Badge
  });

  it("allows role change for non-admin user", async () => {
    const userEventSetup = userEvent.setup();
    const handleChangeRole = vi.fn();
    
    render(
      <table>
        <tbody>
          <AdminUserRow user={mockUser} onChangeRole={handleChangeRole} />
        </tbody>
      </table>
    );

    const select = screen.getByRole("combobox", { name: "Cambiar rol de @l.rodriguez" });
    expect(select.hasAttribute("disabled")).toBe(false);

    await userEventSetup.selectOptions(select, "profesor");
    expect(handleChangeRole).toHaveBeenCalledWith("u-1", "profesor");
  });

  it("disables select when user is admin", () => {
    const adminUser: User = { ...mockUser, role: "admin" };
    
    render(
      <table>
        <tbody>
          <AdminUserRow user={adminUser} onChangeRole={vi.fn()} />
        </tbody>
      </table>
    );

    const select = screen.getByRole("combobox", { name: "Cambiar rol de @l.rodriguez" });
    expect(select.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Los administradores no pueden cambiar de rol.")).toBeDefined();
  });
});
