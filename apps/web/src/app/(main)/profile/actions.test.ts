import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  updateProfileAction,
  changePasswordAction,
  removeAvatarAction,
} from "./actions";
import { mockUsers } from "@/data/users";
import type { Session } from "@/lib/types";

const SESSION_KEY = "facy:session";

const { revalidatePath } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string, type: string) => revalidatePath(path, type),
}));

const originalUsers = mockUsers.map((user) => ({ ...user }));

/** Siembra una sesión válida en `localStorage` (lee el StaticAuthGateway). */
function seedSession(): void {
  const session: Session = {
    user: { id: "u-3", username: "m.rivas", role: "estudiante" },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Construye un FormData con los pares clave-valor indicados. */
function makeForm(entries: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) form.set(key, value);
  return form;
}

beforeEach(() => {
  localStorage.clear();
  revalidatePath.mockClear();
  mockUsers.length = 0;
  mockUsers.push(...originalUsers.map((user) => ({ ...user })));
});

afterEach(() => {
  mockUsers.length = 0;
  mockUsers.push(...originalUsers);
});

describe("updateProfileAction", () => {
  it("rejects unauthenticated requests", async () => {
    const result = await updateProfileAction(
      makeForm({ givenName: "Ana", familyName: "Rivas", email: "a@correo.com" }),
    );

    expect(result).toMatchObject({ success: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns field errors when validation fails", async () => {
    seedSession();
    const result = await updateProfileAction(
      makeForm({ givenName: "A", familyName: "", email: "mal-email" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors ?? {})).toContain("givenName");
    }
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("persists the patch and revalidates the profile route", async () => {
    seedSession();
    const result = await updateProfileAction(
      makeForm({
        givenName: "Ana María",
        familyName: "Rivas",
        email: "maria@correo.com",
        bio: "Nueva bio",
      }),
    );

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/profile/[username]", "page");
    const updated = mockUsers.find((user) => user.id === "u-3");
    expect(updated).toMatchObject({ givenName: "Ana María", bio: "Nueva bio" });
  });
});

describe("changePasswordAction", () => {
  it("rejects unauthenticated requests", async () => {
    const result = await changePasswordAction(
      makeForm({
        currentPassword: "secreto123",
        newPassword: "nuevaclave123",
        confirmPassword: "nuevaclave123",
      }),
    );

    expect(result).toMatchObject({ success: false });
  });

  it("returns field errors when the new password is too short", async () => {
    seedSession();
    const result = await changePasswordAction(
      makeForm({
        currentPassword: "secreto123",
        newPassword: "corta",
        confirmPassword: "corta",
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.newPassword).toBeTruthy();
    }
  });

  it("succeeds with a valid password change (session required)", async () => {
    seedSession();
    const result = await changePasswordAction(
      makeForm({
        currentPassword: "secreto123",
        newPassword: "nuevaclave123",
        confirmPassword: "nuevaclave123",
      }),
    );

    expect(result).toEqual({ success: true });
  });
});

describe("removeAvatarAction", () => {
  it("rejects unauthenticated requests", async () => {
    const result = await removeAvatarAction();
    expect(result).toMatchObject({ success: false });
  });

  it("clears the avatar and revalidates the profile route", async () => {
    seedSession();
    const result = await removeAvatarAction();

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/profile/[username]", "page");
    const updated = mockUsers.find((user) => user.id === "u-3");
    expect(updated?.avatarUrl).toBeNull();
  });
});
