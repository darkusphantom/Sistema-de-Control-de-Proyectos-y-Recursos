import { describe, expect, it } from "vitest";
import {
  LoginSchema,
  RegisterSchema,
  SetUserRoleSchema,
  emailSchema,
  idSchema,
  nameSchema,
  passwordLoginSchema,
  passwordRegisterSchema,
  usernameSchema,
} from "./validation";

describe("validation schemas", () => {
  describe("emailSchema", () => {
    it("accepts a valid email and normalizes to lowercase and trims", () => {
      const result = emailSchema.safeParse("  ANA@Correo.com  ");
      expect(result.success).toBe(true);
      expect(result.data).toBe("ana@correo.com");
    });

    it("rejects a malformed email", () => {
      expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    });

    it("rejects an email longer than 254 chars", () => {
      const long = `${"a".repeat(250)}@correo.com`;
      expect(emailSchema.safeParse(long).success).toBe(false);
    });
  });

  describe("password schemas", () => {
    it("register requires 8 to 128 chars without trimming spaces", () => {
      expect(passwordRegisterSchema.safeParse("abcdefgh").success).toBe(true);
      expect(passwordRegisterSchema.safeParse("  12345678  ").success).toBe(true);
      expect(passwordRegisterSchema.safeParse("1234567").success).toBe(false);
    });

    it("login requires 1 to 128 chars (no min-8 leak)", () => {
      expect(passwordLoginSchema.safeParse("a").success).toBe(true);
      expect(passwordLoginSchema.safeParse("").success).toBe(false);
      expect(passwordLoginSchema.safeParse("a".repeat(129)).success).toBe(false);
    });
  });

  describe("nameSchema", () => {
    it("accepts names with accents, spaces, hyphens and apostrophes", () => {
      expect(nameSchema.safeParse("María").success).toBe(true);
      expect(nameSchema.safeParse("José Luis").success).toBe(true);
      expect(nameSchema.safeParse("Anne-Marie O'Brien").success).toBe(true);
    });

    it("trims and enforces 2-60 length", () => {
      expect(nameSchema.safeParse("  Ana  ").data).toBe("Ana");
      expect(nameSchema.safeParse("A").success).toBe(false);
      expect(nameSchema.safeParse("a".repeat(61)).success).toBe(false);
    });

    it("rejects names with digits or symbols", () => {
      expect(nameSchema.safeParse("Ana123").success).toBe(false);
      expect(nameSchema.safeParse("Ana!").success).toBe(false);
      expect(nameSchema.safeParse("Ana#").success).toBe(false);
    });
  });

  describe("usernameSchema", () => {
    it("accepts lowercase alphanumeric, dot, underscore and hyphen", () => {
      expect(usernameSchema.safeParse("j.rivas").success).toBe(true);
      expect(usernameSchema.safeParse("maria_2").success).toBe(true);
      expect(usernameSchema.safeParse("luis-3").success).toBe(true);
    });

    it("rejects uppercase, accents and other symbols", () => {
      expect(usernameSchema.safeParse("J.Rivas").success).toBe(false);
      expect(usernameSchema.safeParse("maría").success).toBe(false);
      expect(usernameSchema.safeParse("j rivas").success).toBe(false);
    });
  });

  describe("idSchema", () => {
    it("accepts an id of 1-64 chars", () => {
      expect(idSchema.safeParse("u-123").success).toBe(true);
      expect(idSchema.safeParse("").success).toBe(false);
      expect(idSchema.safeParse("a".repeat(65)).success).toBe(false);
    });
  });

  describe("SetUserRoleSchema", () => {
    it("accepts the three roles and rejects others", () => {
      expect(SetUserRoleSchema.safeParse({ role: "coordinador" }).success).toBe(
        true,
      );
      expect(SetUserRoleSchema.safeParse({ role: "aprobador" }).success).toBe(
        true,
      );
      expect(SetUserRoleSchema.safeParse({ role: "admin_sistema" }).success).toBe(
        true,
      );
      expect(SetUserRoleSchema.safeParse({ role: "superuser" }).success).toBe(
        false,
      );
    });
  });

  describe("RegisterSchema and LoginSchema", () => {
    it("accepts a valid register payload", () => {
      const result = RegisterSchema.safeParse({
        givenName: "María",
        familyName: "Rivas",
        email: " MARIA@Correo.com ",
        password: "secreto123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("maria@correo.com");
      }
    });

    it("rejects an invalid register payload with field details", () => {
      const result = RegisterSchema.safeParse({
        givenName: "A",
        familyName: "",
        email: "bad",
        password: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path[0]);
        expect(paths).toContain("givenName");
        expect(paths).toContain("familyName");
        expect(paths).toContain("email");
        expect(paths).toContain("password");
      }
    });

    it("login uses the relaxed password schema", () => {
      expect(
        LoginSchema.safeParse({ username: "j.rivas", password: "a" }).success,
      ).toBe(true);
    });
  });
});
