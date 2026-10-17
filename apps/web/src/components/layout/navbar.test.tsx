import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "./navbar";
import type { Session } from "@/lib/types";

const state = vi.hoisted(() => ({
  pathname: "/dashboard",
  session: null as Session | null,
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/session/session-provider", () => ({
  useSession: () => ({
    status: "authenticated",
    session: state.session,
    signOut: state.signOut,
  }),
}));

/** Usuario de prueba sin privilegios de administración. */
function makeSession(role: Session["user"]["role"]): Session {
  return {
    user: { id: "u-1", username: "m.rivas", role },
    expiresAt: "2099-01-01T00:00:00Z",
  };
}

beforeEach(() => {
  state.pathname = "/dashboard";
  state.session = makeSession("estudiante");
  state.signOut.mockClear();
});

describe("Navbar", () => {
  it("renders the brand linking to /dashboard and the section links", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("link", { name: "Red FaCyT" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute(
      "href",
      "/profile/m.rivas",
    );
  });

  it("hides the admin link for non-admin users", () => {
    render(<Navbar />);
    expect(screen.queryByRole("link", { name: "Administración" })).toBeNull();
  });

  it("shows the admin link for admin users", () => {
    state.session = makeSession("admin");
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Administración" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });

  it("marks the active section with aria-current", () => {
    state.pathname = "/profile/m.rivas";
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("opens the account menu, shows the username and closes on Escape", async () => {
    const userEventSetup = userEvent.setup();
    render(<Navbar />);

    const button = screen.getByRole("button", {
      name: "Cuenta de @m.rivas",
    });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await userEventSetup.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("@m.rivas")).toBeInTheDocument();

    await userEventSetup.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(button).toHaveFocus();
  });

  it("closes the account menu on a click outside", async () => {
    render(<Navbar />);

    await userEvent.click(
      screen.getByRole("button", { name: "Cuenta de @m.rivas" }),
    );
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("signs out from the account menu", async () => {
    const userEventSetup = userEvent.setup();
    render(<Navbar />);

    await userEventSetup.click(
      screen.getByRole("button", { name: "Cuenta de @m.rivas" }),
    );
    await userEventSetup.click(
      screen.getByRole("menuitem", { name: "Cerrar sesión" }),
    );

    expect(state.signOut).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
