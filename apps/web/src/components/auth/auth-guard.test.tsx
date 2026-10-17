import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthGuard } from "./auth-guard";


const { mockReplace } = vi.hoisted(() => ({ mockReplace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe("AuthGuard", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders children if no session", async () => {
    render(<AuthGuard><div data-testid="content" /></AuthGuard>);
    
    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  it("redirects to /feed and hides children if session exists", async () => {
    const mockSession = { user: { id: "1", username: "test", role: "coordinador" }, expiresAt: new Date(Date.now() + 10000).toISOString() };
    localStorage.setItem("facy:session", JSON.stringify(mockSession));
    

    render(<AuthGuard><div data-testid="content" /></AuthGuard>);
    
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });
  });
});
