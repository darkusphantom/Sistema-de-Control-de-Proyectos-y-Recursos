import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "./bottom-nav";
import type { Session } from "@/lib/types";

const state = vi.hoisted(() => ({
  pathname: "/dashboard",
  session: null as Session | null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
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
    signOut: vi.fn(),
  }),
}));

/** Usuario de prueba con el rol indicado. */
function makeSession(role: Session["user"]["role"]): Session {
  return {
    user: { id: "u-1", username: "m.rivas", role },
    expiresAt: "2099-01-01T00:00:00Z",
  };
}

beforeEach(() => {
  state.pathname = "/dashboard";
  state.session = makeSession("estudiante");
});

describe("BottomNav", () => {
  it("shows only Dashboard and Perfil for non-admin users", () => {
    render(<BottomNav />);

    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: /Perfil/ })).toHaveAttribute(
      "href",
      "/profile/m.rivas",
    );
    expect(screen.queryByRole("link", { name: /Admin/ })).toBeNull();
  });

  it("adds the Admin destination for admin users", () => {
    state.session = makeSession("admin");
    render(<BottomNav />);

    expect(screen.getByRole("link", { name: /Admin/ })).toHaveAttribute(
      "href",
      "/admin",
    );
  });

  it("marks the active destination with aria-current", () => {
    state.pathname = "/profile/m.rivas";
    render(<BottomNav />);

    expect(screen.getByRole("link", { name: /Perfil/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: /Dashboard/ }),
    ).not.toHaveAttribute("aria-current");
  });
});
