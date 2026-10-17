import { describe, expect, it } from "vitest";
import {
  AVATAR_DATA_URL_MAX_CHARS,
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  ChangePasswordSchema,
  UpdateProfileSchema,
  avatarDataUrlSchema,
  avatarFileSchema,
  bioSchema,
} from "./profile";

/** Crea un archivo de prueba con el tamaño indicado en bytes. */
function makeFile(size: number, type: string, name = "foto.png"): File {
  return new File([new ArrayBuffer(size)], name, { type });
}

describe("bioSchema", () => {
  it("trims and accepts bios of 1-160 chars", () => {
    expect(bioSchema.parse("  Docente  ")).toBe("Docente");
    expect(bioSchema.safeParse("a".repeat(160)).success).toBe(true);
    expect(bioSchema.safeParse("a".repeat(161)).success).toBe(false);
    // La cadena vacía es válida (se guarda como null en la capa de aplicación).
    expect(bioSchema.safeParse("").success).toBe(true);
  });
});

describe("avatarFileSchema", () => {
  it("accepts a PNG and a JPG under 5 MB", () => {
    expect(
      avatarFileSchema.safeParse(makeFile(1024, "image/png")).success,
    ).toBe(true);
    expect(
      avatarFileSchema.safeParse(makeFile(1024, "image/jpeg")).success,
    ).toBe(true);
  });

  it("rejects an empty file, an invalid type and an oversized file", () => {
    expect(
      avatarFileSchema.safeParse(makeFile(0, "image/png")).success,
    ).toBe(false);
    expect(
      avatarFileSchema.safeParse(makeFile(1024, "application/pdf")).success,
    ).toBe(false);
    expect(
      avatarFileSchema.safeParse(
        makeFile(AVATAR_MAX_BYTES + 1, "image/png"),
      ).success,
    ).toBe(false);
  });

  it("exposes the documented limits", () => {
    expect(AVATAR_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(AVATAR_MIME_TYPES).toEqual(["image/png", "image/jpeg"]);
  });
});

describe("avatarDataUrlSchema", () => {
  const validPng = `data:image/png;base64,${"A".repeat(16)}`;

  it("accepts a whitelisted data URL within the char cap", () => {
    expect(avatarDataUrlSchema.safeParse(validPng).success).toBe(true);
    expect(
      avatarDataUrlSchema.safeParse(
        `data:image/jpeg;base64,${"A".repeat(16)}`,
      ).success,
    ).toBe(true);
  });

  it("rejects other prefixes and oversized payloads", () => {
    expect(
      avatarDataUrlSchema.safeParse("data:image/gif;base64,AAAA").success,
    ).toBe(false);
    expect(
      avatarDataUrlSchema.safeParse("https://cdn.ejemplo.com/foto.png").success,
    ).toBe(false);
    expect(
      avatarDataUrlSchema.safeParse(
        `data:image/png;base64,${"A".repeat(AVATAR_DATA_URL_MAX_CHARS + 1)}`,
      ).success,
    ).toBe(false);
  });

  it("caps the data URL at ceil(MAX_BYTES * 4 / 3)", () => {
    expect(AVATAR_DATA_URL_MAX_CHARS).toBe(
      Math.ceil((AVATAR_MAX_BYTES * 4) / 3),
    );
  });
});

describe("UpdateProfileSchema", () => {
  it("accepts a partial patch of personal fields", () => {
    const result = UpdateProfileSchema.safeParse({ givenName: "Ana" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty patch and unknown fields (strict)", () => {
    expect(UpdateProfileSchema.safeParse({}).success).toBe(false);
    expect(UpdateProfileSchema.safeParse({ role: "admin" }).success).toBe(false);
  });

  it("validates each field with its own schema", () => {
    expect(UpdateProfileSchema.safeParse({ email: "mal-email" }).success).toBe(
      false,
    );
    expect(UpdateProfileSchema.safeParse({ bio: null }).success).toBe(true);
  });
});

describe("ChangePasswordSchema", () => {
  const valid = {
    currentPassword: "secreto123",
    newPassword: "nuevaclave123",
    confirmPassword: "nuevaclave123",
  };

  it("accepts a matching, non-repeated password change", () => {
    expect(ChangePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a confirmation mismatch", () => {
    expect(
      ChangePasswordSchema.safeParse({
        ...valid,
        confirmPassword: "distinta123",
      }).success,
    ).toBe(false);
  });

  it("rejects reusing the current password", () => {
    expect(
      ChangePasswordSchema.safeParse({
        currentPassword: "secreto123",
        newPassword: "secreto123",
        confirmPassword: "secreto123",
      }).success,
    ).toBe(false);
  });

  it("rejects a short new password and unknown fields", () => {
    expect(
      ChangePasswordSchema.safeParse({
        ...valid,
        newPassword: "corta",
        confirmPassword: "corta",
      }).success,
    ).toBe(false);
    expect(
      ChangePasswordSchema.safeParse({ ...valid, extra: true }).success,
    ).toBe(false);
  });
});
