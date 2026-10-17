import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PasswordForm } from "./password-form";
import { changePasswordAction } from "@/app/(main)/profile/actions";

vi.mock("@/app/(main)/profile/actions", () => ({
  changePasswordAction: vi.fn().mockResolvedValue({ success: true }),
}));

/** Rellena el formulario con credenciales válidas. */
function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Contraseña actual *"), {
    target: { value: "secreto123" },
  });
  fireEvent.change(screen.getByLabelText("Nueva contraseña *"), {
    target: { value: "nuevaclave123" },
  });
  fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña *"), {
    target: { value: "nuevaclave123" },
  });
}

describe("PasswordForm", () => {
  beforeEach(() => {
    vi.mocked(changePasswordAction).mockClear();
    vi.mocked(changePasswordAction).mockResolvedValue({ success: true });
  });

  it("renders correctly", () => {
    const onCancel = vi.fn();
    const onSuccess = vi.fn();
    render(<PasswordForm onCancel={onCancel} onSuccess={onSuccess} />);
    
    expect(screen.getByLabelText("Contraseña actual *")).toBeDefined();
    expect(screen.getByLabelText("Nueva contraseña *")).toBeDefined();
    expect(screen.getByLabelText("Confirmar nueva contraseña *")).toBeDefined();
  });

  it("calls onCancel when cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<PasswordForm onCancel={onCancel} onSuccess={vi.fn()} />);
    
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("submits the form and calls onSuccess", async () => {
    const onSuccess = vi.fn();
    render(<PasswordForm onCancel={vi.fn()} onSuccess={onSuccess} />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(changePasswordAction).toHaveBeenCalled();
  });

  it("shows inline and summary errors when the action fails", async () => {
    vi.mocked(changePasswordAction).mockResolvedValueOnce({
      success: false,
      error: "Revisa los campos del formulario.",
      fieldErrors: { newPassword: "La contraseña debe tener al menos 8 caracteres." },
    });
    const onSuccess = vi.fn();
    render(<PasswordForm onCancel={vi.fn()} onSuccess={onSuccess} />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Revisa los campos del formulario.",
      );
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Cambiar contraseña" })).toBeEnabled();
  });
});
