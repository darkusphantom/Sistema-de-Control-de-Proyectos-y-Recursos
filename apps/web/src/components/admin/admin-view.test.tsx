import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminView } from "./admin-view";
import type { Session } from "@/lib/types";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

const state = vi.hoisted(() => ({
  session: null as Session | null,
  status: "loading" as "loading" | "authenticated" | "anonymous",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/session/session-provider", () => ({
  useSession: () => state,
}));

/** Sesión con el rol indicado. */
function makeSession(role: Session["user"]["role"]): Session {
  return {
    user: { id: "u-1", username: "admin", role },
    expiresAt: "2099-01-01T00:00:00Z",
  };
}

beforeEach(() => {
  replace.mockClear();
  state.session = null;
  state.status = "loading";
});

describe("AdminView", () => {
  it("renders a busy placeholder while the session loads", () => {
    render(<AdminView />);
    expect(screen.getByLabelText("Cargando panel de administración")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("redirects authenticated non-admin users to /feed", () => {
    state.status = "authenticated";
    state.session = makeSession("estudiante");
    render(<AdminView />);

    expect(replace).toHaveBeenCalledWith("/feed");
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("renders the admin panel with the user management section", () => {
    state.status = "authenticated";
    state.session = makeSession("admin");
    render(<AdminView />);

    expect(
      screen.getByRole("heading", { name: "Panel de Administración" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Gestión de usuarios \(\d+\)/)).toBeInTheDocument();
  });

  it("announces a role change with a polite status message", async () => {
    const userEventSetup = userEvent.setup();
    state.status = "authenticated";
    state.session = makeSession("admin");
    render(<AdminView />);

    const select = screen.getByRole("combobox", {
      name: "Cambiar rol de @j.perez",
    });
    await userEventSetup.selectOptions(select, "admin");
    await userEventSetup.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        'Rol de @j.perez actualizado a "admin".',
      );
    });
  });
});
