import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileForm } from "./profile-form";
import { updateProfileAction } from "@/app/(main)/profile/actions";
import type { User } from "@/lib/types";

// Mock the action
vi.mock("@/app/(main)/profile/actions", () => ({
  updateProfileAction: vi.fn().mockResolvedValue({ success: true }),
}));

describe("ProfileForm", () => {
  const user: User = {
    id: "1",
    username: "jperez",
    email: "j@correo.com",
    givenName: "Juan",
    familyName: "Pérez",
    role: "coordinador",
    createdAt: "2026",
    bio: "Bio original",
  };

  beforeEach(() => {
    vi.mocked(updateProfileAction).mockClear();
    vi.mocked(updateProfileAction).mockResolvedValue({ success: true });
  });

  it("renders with user data", () => {
    const onCancel = vi.fn();
    const onSuccess = vi.fn();
    render(<ProfileForm user={user} onCancel={onCancel} onSuccess={onSuccess} />);
    
    expect((screen.getByLabelText("Nombre *") as HTMLInputElement).value).toBe("Juan");
    expect((screen.getByLabelText("Apellido *") as HTMLInputElement).value).toBe("Pérez");
    expect((screen.getByLabelText("Correo *") as HTMLInputElement).value).toBe("j@correo.com");
    expect((screen.getByLabelText("Bio") as HTMLTextAreaElement).value).toBe("Bio original");
    expect(screen.getByText("@jperez")).toBeDefined();
  });

  it("calls onCancel when cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<ProfileForm user={user} onCancel={onCancel} onSuccess={vi.fn()} />);
    
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("submits the form and calls onSuccess", async () => {
    const onSuccess = vi.fn();
    render(<ProfileForm user={user} onCancel={vi.fn()} onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(updateProfileAction).toHaveBeenCalled();
  });

  it("shows inline and summary errors when the action fails", async () => {
    vi.mocked(updateProfileAction).mockResolvedValueOnce({
      success: false,
      error: "Revisa los campos del formulario.",
      fieldErrors: { email: "Correo inválido." },
    });
    const onSuccess = vi.fn();
    render(<ProfileForm user={user} onCancel={vi.fn()} onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Revisa los campos del formulario.",
      );
    });
    expect(screen.getAllByText("Correo inválido.").length).toBeGreaterThan(0);
    expect(onSuccess).not.toHaveBeenCalled();
    // El formulario vuelve a estar habilitado tras el error.
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
  });

  it("copies the username to the clipboard and announces it politely", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<ProfileForm user={user} onCancel={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Copiar/ }));

    expect(writeText).toHaveBeenCalledWith("@jperez");
  });

  it("updates the bio character counter while typing", () => {
    render(<ProfileForm user={user} onCancel={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Bio"), {
      target: { value: "Hola" },
    });

    expect(screen.getByText("4 / 160")).toBeInTheDocument();
  });
});
