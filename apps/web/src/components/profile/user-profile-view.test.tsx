import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserProfileView } from "./user-profile-view";
import type { User } from "@/lib/types";

vi.mock("./profile-form", () => ({
  ProfileForm: ({
    onCancel,
    onSuccess,
  }: {
    onCancel: () => void;
    onSuccess: () => void;
  }) => (
    <div>
      <p>Formulario de perfil abierto</p>
      <button type="button" onClick={onSuccess}>
        Simular éxito de perfil
      </button>
      <button type="button" onClick={onCancel}>
        Cancelar edición
      </button>
    </div>
  ),
}));

vi.mock("./password-form", () => ({
  PasswordForm: ({
    onCancel,
    onSuccess,
  }: {
    onCancel: () => void;
    onSuccess: () => void;
  }) => (
    <div>
      <p>Formulario de contraseña abierto</p>
      <button type="button" onClick={onSuccess}>
        Simular éxito de contraseña
      </button>
      <button type="button" onClick={onCancel}>
        Cancelar contraseña
      </button>
    </div>
  ),
}));

/** Usuario de prueba con el rol y bio indicados. */
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "u-1",
    username: "m.rivas",
    email: "maria@correo.com",
    givenName: "María",
    familyName: "Rivas",
    role: "estudiante",
    createdAt: "2026-09-01T00:00:00Z",
    bio: "Docente y investigadora.",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UserProfileView", () => {
  it("renders the identity data of the user", () => {
    render(<UserProfileView user={makeUser()} isOwnProfile />);

    expect(
      screen.getByRole("heading", { level: 1, name: "María Rivas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("@m.rivas · maria@correo.com"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Miembro desde/)).toBeInTheDocument();
    expect(screen.getByText("Docente y investigadora.")).toBeInTheDocument();
  });

  it("renders the bio section only when a bio exists", () => {
    render(<UserProfileView user={makeUser({ bio: undefined })} isOwnProfile />);
    expect(
      screen.queryByText("Docente y investigadora."),
    ).not.toBeInTheDocument();
  });

  it("hides the edit actions on someone else's profile", () => {
    render(<UserProfileView user={makeUser()} isOwnProfile={false} />);

    expect(screen.queryByRole("button", { name: /Editar perfil/ })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Cambiar contraseña/ }),
    ).toBeNull();
  });

  it("opens the profile form and returns to the read view on cancel", () => {
    render(<UserProfileView user={makeUser()} isOwnProfile />);

    fireEvent.click(screen.getByRole("button", { name: /Editar perfil/ }));
    expect(screen.getByText("Formulario de perfil abierto")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar edición" }));
    expect(
      screen.queryByText("Formulario de perfil abierto"),
    ).toBeNull();
  });

  it("opens the password form and returns to the read view on cancel", () => {
    render(<UserProfileView user={makeUser()} isOwnProfile />);

    fireEvent.click(
      screen.getByRole("button", { name: "Cambiar contraseña" }),
    );
    expect(
      screen.getByText("Formulario de contraseña abierto"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar contraseña" }),
    );
    expect(
      screen.queryByText("Formulario de contraseña abierto"),
    ).toBeNull();
  });

  it("shows a polite status message after a successful profile update", () => {
    render(<UserProfileView user={makeUser()} isOwnProfile />);

    fireEvent.click(screen.getByRole("button", { name: /Editar perfil/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Simular éxito de perfil" }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Perfil actualizado correctamente.",
    );
    expect(
      screen.queryByText("Formulario de perfil abierto"),
    ).toBeNull();
  });

  it("shows a polite status message after a successful password change", () => {
    render(<UserProfileView user={makeUser()} isOwnProfile />);

    fireEvent.click(
      screen.getByRole("button", { name: "Cambiar contraseña" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Simular éxito de contraseña" }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Contraseña actualizada correctamente.",
    );
  });

  it("renders the role badge for each legacy role tone", () => {
    const { rerender } = render(
      <UserProfileView user={makeUser({ role: "admin" })} isOwnProfile />,
    );
    expect(screen.getByText("admin")).toBeInTheDocument();

    rerender(<UserProfileView user={makeUser({ role: "profesor" })} isOwnProfile />);
    expect(screen.getByText("profesor")).toBeInTheDocument();

    rerender(
      <UserProfileView user={makeUser({ role: "estudiante" })} isOwnProfile />,
    );
    expect(screen.getByText("estudiante")).toBeInTheDocument();
  });
});
