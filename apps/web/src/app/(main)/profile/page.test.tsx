import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ProfileRedirectPage from "./page";
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

beforeEach(() => {
  replace.mockClear();
  state.session = null;
  state.status = "loading";
});

describe("ProfileRedirectPage (/profile)", () => {
  it("renders a loading indicator", () => {
    render(<ProfileRedirectPage />);
    expect(screen.getByLabelText("Cargando perfil")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("redirects authenticated users to their own profile", async () => {
    state.status = "authenticated";
    state.session = {
      user: { id: "u-3", username: "m.rivas", role: "estudiante" },
      expiresAt: "2099-01-01T00:00:00Z",
    };
    render(<ProfileRedirectPage />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/profile/m.rivas"),
    );
  });

  it("redirects anonymous users to /login", async () => {
    state.status = "anonymous";
    render(<ProfileRedirectPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
