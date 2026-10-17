import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { StaticAuthGateway } from "./auth-gateway.static";
import { mockUsers } from "@/data/users";

describe("StaticAuthGateway", () => {
  let gateway: StaticAuthGateway;
  const SESSION_KEY = "facy:session";

  beforeEach(() => {
    gateway = new StaticAuthGateway();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("signIn", () => {
    it("returns session and saves to localStorage on valid credentials", async () => {
      const formData = new FormData();
      formData.append("username", "admin");
      formData.append("password", "anypassword");

      const result = await gateway.signIn(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session.user.username).toBe("admin");
        const stored = localStorage.getItem(SESSION_KEY);
        expect(stored).toBeTruthy();
        expect(JSON.parse(stored!).user.username).toBe("admin");
      }
    });

    it("returns error on invalid user", async () => {
      const formData = new FormData();
      formData.append("username", "nonexistent");
      formData.append("password", "anypassword");

      const result = await gateway.signIn(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("El usuario o la contraseña no coinciden.");
      }
    });
  });

  describe("signUp", () => {
    it("returns session and saves to localStorage on new email", async () => {
      const formData = new FormData();
      formData.append("email", "newuser@correo.com");
      formData.append("given-name", "John");
      formData.append("family-name", "Doe");
      formData.append("new-password", "password123");

      const result = await gateway.signUp(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session.user.username).toBe("john.doe");
        const stored = localStorage.getItem(SESSION_KEY);
        expect(stored).toBeTruthy();
      }
    });

    it("returns error on existing email", async () => {
      const formData = new FormData();
      formData.append("email", mockUsers[0].email);
      formData.append("new-password", "password123");

      const result = await gateway.signUp(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("No pudimos crear la cuenta. Intenta de nuevo.");
        expect(result.fieldErrors?.email).toBe("Ya existe una cuenta con ese correo.");
      }
    });
  });

  describe("getSession", () => {
    it("returns null if no session", async () => {
      const session = await gateway.getSession();
      expect(session).toBeNull();
    });

    it("returns session if valid", async () => {
      const mockSession = { user: { id: "1", username: "test", role: "coordinador" }, expiresAt: new Date(Date.now() + 10000).toISOString() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(mockSession));
      const session = await gateway.getSession();
      expect(session?.user.username).toBe("test");
    });

    it("returns null and clears if expired", async () => {
      const mockSession = { user: { id: "1", username: "test", role: "coordinador" }, expiresAt: new Date(Date.now() - 10000).toISOString() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(mockSession));
      const session = await gateway.getSession();
      expect(session).toBeNull();
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    });
  });

  describe("signOut", () => {
    it("removes session from localStorage", async () => {
      localStorage.setItem(SESSION_KEY, "some-data");
      await gateway.signOut();
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    });
  });

  describe("changePassword", () => {
    it("simulates success when there is an active session", async () => {
      const mockSession = {
        user: { id: "1", username: "test", role: "coordinador" },
        expiresAt: new Date(Date.now() + 10000).toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(mockSession));

      const result = await gateway.changePassword("secreto123", "nuevaclave123");
      expect(result.success).toBe(true);
    });

    it("fails when there is no session", async () => {
      const result = await gateway.changePassword("secreto123", "nuevaclave123");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("No hay sesión activa.");
      }
    });
  });
});
