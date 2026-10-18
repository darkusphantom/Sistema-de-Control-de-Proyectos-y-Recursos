import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { LoginForm } from "./login-form";

const { mockReplace } = vi.hoisted(() => ({ mockReplace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock("@/lib/auth/auth-gateway.static", () => {
  return {
    StaticAuthGateway: class {
      signIn = vi.fn((formData: FormData) => {
        const username = formData.get("username");
        if (username === "admin") {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: false, error: "El usuario o la contraseña no coinciden." });
      });
    }
  };
});

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<LoginForm />);
    expect(screen.getByRole("heading", { name: "Sistema de Control de Proyectos y Recursos" })).toBeInTheDocument();
    expect(screen.getByLabelText("Usuario")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
  });

  it("validates fields on submit and shows inline and summary errors", () => {
    render(<LoginForm />);
    
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(screen.getAllByText("Escribe tu usuario.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Escribe tu contraseña.").length).toBeGreaterThan(0);
    // Summary alert is shown (2 errors)
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("submits successfully and redirects", async () => {
    render(<LoginForm />);
    
    fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "password123" } });
    
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("handles invalid credentials by emptying password field", async () => {
    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText("Usuario");
    const passwordInput = screen.getByLabelText("Contraseña") as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: "wrong" } });
    fireEvent.change(passwordInput, { target: { value: "pass123" } });
    
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("El usuario o la contraseña no coinciden.")).toBeInTheDocument();
      // Password must be emptied
      expect(passwordInput.value).toBe("");
      // Username is preserved
      expect((usernameInput as HTMLInputElement).value).toBe("wrong");
    });
  });

  it("revalidates a single field on blur after the first submit", async () => {
    render(<LoginForm />);

    // Primer envío inválido: marca el formulario como enviado.
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(screen.getAllByText("Escribe tu usuario.").length).toBeGreaterThan(0);

    // Corregir el usuario y salir del campo limpia su error en línea.
    const usernameInput = screen.getByLabelText("Usuario");
    fireEvent.change(usernameInput, { target: { value: "m.rivas" } });
    fireEvent.blur(usernameInput);
    expect(screen.queryByText("Escribe tu usuario.")).toBeNull();

    // La contraseña vacía sigue marcada al salir del campo.
    const passwordInput = screen.getByLabelText("Contraseña");
    fireEvent.blur(passwordInput);
    expect(screen.getAllByText("Escribe tu contraseña.").length).toBeGreaterThan(0);
  });
});
