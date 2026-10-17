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
    role: "coordinador",
    createdAt: "2026-09-02T10:00:00Z",
  };

  it("renders user information correctly without email", () => {
    render(
      <table>
        <tbody>
          <AdminUserRow user={mockUser} onChangeRole={vi.fn()} />
        </tbody>
      </table>,
    );

    expect(screen.getByText("Luis Rodríguez")).toBeDefined();
    expect(screen.getByText("@l.rodriguez")).toBeDefined();
    expect(screen.queryByText("l.rodriguez@facyt.edu")).toBeNull();
    expect(screen.getAllByText("coordinador")[0]).toBeDefined(); // Badge
  });

  it("allows role change for non-admin user", async () => {
    const userEventSetup = userEvent.setup();
    const handleChangeRole = vi.fn();

    render(
      <table>
        <tbody>
          <AdminUserRow user={mockUser} onChangeRole={handleChangeRole} />
        </tbody>
      </table>,
    );

    const select = screen.getByRole("combobox", { name: "Cambiar rol de @l.rodriguez" });
    expect(select.hasAttribute("disabled")).toBe(false);

    await userEventSetup.selectOptions(select, "aprobador");
    expect(handleChangeRole).toHaveBeenCalledWith("u-1", "aprobador");
  });

  it("disables select when user is admin_sistema", () => {
    const adminUser: User = { ...mockUser, role: "admin_sistema" };

    render(
      <table>
        <tbody>
          <AdminUserRow user={adminUser} onChangeRole={vi.fn()} />
        </tbody>
      </table>,
    );

    const select = screen.getByRole("combobox", { name: "Cambiar rol de @l.rodriguez" });
    expect(select.hasAttribute("disabled")).toBe(true);
    expect(
      screen.getByText("Los administradores del sistema no pueden cambiar de rol."),
    ).toBeDefined();
  });
});
