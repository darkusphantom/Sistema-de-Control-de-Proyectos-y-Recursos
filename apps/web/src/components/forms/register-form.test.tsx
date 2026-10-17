import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { RegisterForm } from "./register-form";

const { mockReplace } = vi.hoisted(() => ({ mockReplace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock("@/lib/auth/auth-gateway.static", () => {
  return {
    StaticAuthGateway: class {
      signUp = vi.fn((formData: FormData) => {
        const email = formData.get("email");
        if (email === "existente@correo.com") {
          return Promise.resolve({ 
            success: false, 
            error: "No pudimos crear la cuenta. Intenta de nuevo.",
            fieldErrors: { email: "Ya existe una cuenta con ese correo." }
          });
        }
        return Promise.resolve({ success: true });
      });
    }
  };
});

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<RegisterForm />);
    expect(screen.getByRole("heading", { name: "Crear cuenta" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Apellido")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar contraseña")).toBeInTheDocument();
  });

  it("validates fields on submit and shows summary", () => {
    render(<RegisterForm />);
    
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    // Form summary box should appear due to many errors
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getAllByText("Escribe tu nombre.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Escribe tu correo.").length).toBeGreaterThan(0);
  });

  it("submits successfully and redirects", async () => {
    render(<RegisterForm />);
    
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText("Apellido"), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: "password123" } });
    
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/feed");
    });
  });

  it("handles existing email error without emptying password", async () => {
    render(<RegisterForm />);
    
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText("Apellido"), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "existente@correo.com" } });
    
    const passInput = screen.getByLabelText("Contraseña") as HTMLInputElement;
    fireEvent.change(passInput, { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: "password123" } });
    
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("No pudimos crear la cuenta. Intenta de nuevo.")).toBeInTheDocument();
      // Error in email field specifically
      expect(screen.getAllByText("Ya existe una cuenta con ese correo.").length).toBeGreaterThan(0);
      
      // Password must be conserved
      expect(passInput.value).toBe("password123");
    });
  });

  it("revalidates a single field on blur after the first submit", async () => {
    render(<RegisterForm />);

    // Primer envío inválido: marca el formulario como enviado.
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(screen.getAllByText("Escribe tu nombre.").length).toBeGreaterThan(0);

    // Corregir el nombre y salir del campo limpia su error en línea.
    const nameInput = screen.getByLabelText("Nombre");
    fireEvent.change(nameInput, { target: { value: "María" } });
    fireEvent.blur(nameInput);
    expect(screen.queryByText("Escribe tu nombre.")).toBeNull();

    // Confirmar una contraseña que no coincide marca el error en blur.
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "password123" },
    });
    const confirmInput = screen.getByLabelText("Confirmar contraseña");
    fireEvent.change(confirmInput, { target: { value: "distinta123" } });
    fireEvent.blur(confirmInput);
    expect(
      screen.getAllByText("Las contraseñas no coinciden.").length,
    ).toBeGreaterThan(0);
  });
});
