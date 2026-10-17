import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider, useSession } from "./session-provider";
import type { Session } from "@/lib/types";

const SESSION_KEY = "facy:session";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

/**
 * Construye una sesión válida (futura en 1 hora) para sembrar `localStorage`.
 */
function makeSession(): Session {
  return {
    user: { id: "u-1", username: "m.rivas", role: "estudiante" },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

/** Sonda que expone el contexto de sesión en el DOM. */
function Probe() {
  const { status, session, signOut } = useSession();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{session?.user.username ?? ""}</span>
      <button type="button" onClick={() => void signOut()}>
        Salir
      </button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  replace.mockClear();
});

describe("SessionProvider", () => {
  it("renders an aria-busy container while resolving the session", () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(makeSession()));
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    expect(screen.getByLabelText("Cargando sesión")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.queryByTestId("status")).not.toBeInTheDocument();
  });

  it("exposes the stored session once resolved", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(makeSession()));
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    expect(await screen.findByTestId("status")).toHaveTextContent(
      "authenticated",
    );
    expect(screen.getByTestId("user")).toHaveTextContent("m.rivas");
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects anonymous visitors to /login and renders nothing", async () => {
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/login"),
    );
    expect(screen.queryByTestId("status")).not.toBeInTheDocument();
  });

  it("treats an expired session as anonymous and clears the stored key", async () => {
    const expired: Session = {
      user: { id: "u-1", username: "m.rivas", role: "estudiante" },
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(expired));
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("treats a corrupted stored payload as anonymous", async () => {
    localStorage.setItem(SESSION_KEY, "{not-json");
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("signs out, clears the session and redirects to /login", async () => {
    const userEventSetup = userEvent.setup();
    localStorage.setItem(SESSION_KEY, JSON.stringify(makeSession()));
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    await screen.findByTestId("status");
    await userEventSetup.click(screen.getByRole("button", { name: "Salir" }));

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    // Con la sesión anónima el provider deja de renderizar el shell autenticado.
    expect(screen.queryByTestId("status")).not.toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("throws when useSession is called outside a provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      "useSession must be used inside a <SessionProvider>.",
    );
    spy.mockRestore();
  });
});
