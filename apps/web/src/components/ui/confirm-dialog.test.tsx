import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./confirm-dialog";

const onClose = vi.fn();
const onConfirm = vi.fn();

/** Renderiza un ConfirmDialog abierto con handlers registrables. */
function renderDialog(isPending = false) {
  return render(
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
      title="Eliminar recurso"
      body="Esta acción no se puede deshacer."
      confirmLabel="Eliminar"
      isPending={isPending}
    />,
  );
}

beforeEach(() => {
  onClose.mockClear();
  onConfirm.mockClear();
});

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Eliminar recurso"
        body="Cuerpo"
        confirmLabel="Eliminar"
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("exposes an accessible modal dialog with title and body", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { name: /Eliminar recurso/ })).toBeInTheDocument();
    expect(screen.getByText("Esta acción no se puede deshacer.")).toBeInTheDocument();
  });

  it("focuses the cancel button and closes on Escape", async () => {
    const userEventSetup = userEvent.setup();
    renderDialog();

    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();

    await userEventSetup.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("closes from the header ✕ button and from the backdrop", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    // El backdrop es el primer hijo con aria-hidden del portal del diálogo.
    const backdrop = document.querySelector('[aria-hidden="true"]');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("confirms the action from the footer", async () => {
    const userEventSetup = userEvent.setup();
    renderDialog();

    await userEventSetup.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("disables both actions while pending and shows the pending label", () => {
    renderDialog(true);

    expect(screen.getByRole("button", { name: "Eliminando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});
