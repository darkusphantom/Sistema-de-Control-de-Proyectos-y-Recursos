import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmRoleDialog } from "./confirm-role-dialog";

describe("ConfirmRoleDialog", () => {
  it("renders correctly and displays the expected text", () => {
    render(
      <ConfirmRoleDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        username="l.rodriguez"
        currentRole="estudiante"
        newRole="profesor"
      />
    );

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Confirmar cambio de rol" })
    ).toBeDefined();
    expect(
      screen.getByText('¿Cambiar el rol de @l.rodriguez de "estudiante" a "profesor"?')
    ).toBeDefined();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <ConfirmRoleDialog
        open={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        username="test"
        currentRole="estudiante"
        newRole="profesor"
      />
    );

    const cancelButton = screen.getByRole("button", { name: "Cancelar" });
    await user.click(cancelButton);
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    render(
      <ConfirmRoleDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        username="test"
        currentRole="estudiante"
        newRole="profesor"
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Confirmar" });
    await user.click(confirmButton);
    expect(handleConfirm).toHaveBeenCalledOnce();
  });

  it("displays pending state", () => {
    render(
      <ConfirmRoleDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        username="test"
        currentRole="estudiante"
        newRole="profesor"
        isPending={true}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Confirmando…" });
    expect(confirmButton).toBeDefined();
    expect(confirmButton.hasAttribute("disabled")).toBe(true);

    const cancelButton = screen.getByRole("button", { name: "Cancelar" });
    expect(cancelButton.hasAttribute("disabled")).toBe(true);
  });
});
