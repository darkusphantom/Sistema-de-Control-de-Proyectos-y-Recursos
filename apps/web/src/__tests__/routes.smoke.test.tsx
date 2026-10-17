import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";
import LandingPage from "@/app/(landing)/page";
import DashboardPage from "@/app/(main)/dashboard/page";
import ProfilePage from "@/app/(main)/profile/[username]/page";
import AdminPage from "@/app/(main)/admin/page";

const { replace, push, back } = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push, back }),
  usePathname: () => "/dashboard",
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/lib/session/session-provider", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSession: () => ({
    status: "authenticated",
    session: { user: { id: "u-1", username: "admin", role: "admin" }, expiresAt: "2099-01-01T00:00:00Z" },
    signOut: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

beforeEach(() => {
  replace.mockClear();
  window.localStorage.clear();
});

/**
 * Smoke tests that render every route of the scaffold.
 * Guarantee that all App Router pages mount without errors.
 */
describe("route smoke tests", () => {
  it("renders the landing page", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Sistema de Control de Proyectos/i }),
    ).toBeInTheDocument();
  });

  it("renders the login page", async () => {
    render(<LoginPage />);
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("renders the register page", async () => {
    render(<RegisterPage />);
    expect(
      await screen.findByRole("heading", { name: "Crear cuenta" }),
    ).toBeInTheDocument();
  });

  it("renders the dashboard page", () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Dashboard/i }),
    ).toBeInTheDocument();
  });

  it("renders the profile page", async () => {
    render(await ProfilePage({ params: Promise.resolve({ username: "m.rivas" }) }));
    expect(
      await screen.findByRole("heading", { level: 1, name: /María Rivas/i }),
    ).toBeInTheDocument();
  });

  it("renders the admin page", () => {
    render(<AdminPage />);
    expect(
      screen.getByRole("heading", { name: "Panel de Administración" }),
    ).toBeInTheDocument();
  });
});
