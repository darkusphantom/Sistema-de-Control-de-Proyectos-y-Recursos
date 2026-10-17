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
  sessionSchema,
  usernameSchema,
  userSchema,
} from "./auth";

describe("emailSchema", () => {
  it("normalizes to lowercase and trims", () => {
    expect(emailSchema.parse("  ANA@Correo.com  ")).toBe("ana@correo.com");
  });

  it("rejects malformed emails and those over 254 chars", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(
      emailSchema.safeParse(`${"a".repeat(250)}@correo.com`).success,
    ).toBe(false);
  });
});

describe("password schemas", () => {
  it("register requires 8-128 chars without trimming spaces", () => {
    expect(passwordRegisterSchema.safeParse("abcdefgh").success).toBe(true);
    expect(passwordRegisterSchema.safeParse("  12345678  ").success).toBe(true);
    expect(passwordRegisterSchema.safeParse("1234567").success).toBe(false);
    expect(passwordRegisterSchema.safeParse("a".repeat(129)).success).toBe(
      false,
    );
  });

  it("login requires 1-128 chars (no min-8 leak)", () => {
    expect(passwordLoginSchema.safeParse("a").success).toBe(true);
    expect(passwordLoginSchema.safeParse("").success).toBe(false);
    expect(passwordLoginSchema.safeParse("a".repeat(129)).success).toBe(false);
  });
});

describe("nameSchema", () => {
  it("accepts letters with accents, spaces, hyphens and apostrophes", () => {
    expect(nameSchema.safeParse("María").success).toBe(true);
    expect(nameSchema.safeParse("José Luis").success).toBe(true);
    expect(nameSchema.safeParse("Anne-Marie O'Brien").success).toBe(true);
  });

  it("trims and enforces 2-60 length", () => {
    expect(nameSchema.parse("  Ana  ")).toBe("Ana");
    expect(nameSchema.safeParse("A").success).toBe(false);
    expect(nameSchema.safeParse("a".repeat(61)).success).toBe(false);
  });

  it("rejects names with digits or symbols", () => {
    expect(nameSchema.safeParse("Ana123").success).toBe(false);
    expect(nameSchema.safeParse("Ana!").success).toBe(false);
  });
});

describe("usernameSchema", () => {
  it("accepts lowercase alphanumeric plus dot, underscore and hyphen", () => {
    expect(usernameSchema.safeParse("j.rivas").success).toBe(true);
    expect(usernameSchema.safeParse("maria_2").success).toBe(true);
    expect(usernameSchema.safeParse("luis-3").success).toBe(true);
  });

  it("rejects uppercase, accents and other symbols", () => {
    expect(usernameSchema.safeParse("J.Rivas").success).toBe(false);
    expect(usernameSchema.safeParse("maría").success).toBe(false);
    expect(usernameSchema.safeParse("j rivas").success).toBe(false);
  });

  it("trims and enforces 1-50 length", () => {
    expect(usernameSchema.parse("  ana  ")).toBe("ana");
    expect(usernameSchema.safeParse("").success).toBe(false);
    expect(usernameSchema.safeParse("a".repeat(51)).success).toBe(false);
  });
});

describe("idSchema", () => {
  it("accepts ids of 1-64 chars", () => {
    expect(idSchema.safeParse("u-123").success).toBe(true);
    expect(idSchema.safeParse("").success).toBe(false);
    expect(idSchema.safeParse("a".repeat(65)).success).toBe(false);
  });
});

describe("RegisterSchema", () => {
  it("accepts a valid payload and normalizes the email", () => {
    const result = RegisterSchema.safeParse({
      givenName: "María",
      familyName: "Rivas",
      email: " MARIA@Correo.com ",
      password: "secreto123",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("maria@correo.com");
  });

  it("strips an extra role field (R12: registro público sin rol)", () => {
    const result = RegisterSchema.safeParse({
      givenName: "María",
      familyName: "Rivas",
      email: "maria@correo.com",
      password: "secreto123",
      role: "admin",
    });
    // zod por defecto no rechaza extras, pero los descarta del resultado.
    expect(result.success).toBe(true);
    if (result.success) expect("role" in result.data).toBe(false);
  });

  it("reports every invalid field", () => {
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
});

describe("LoginSchema", () => {
  it("accepts a valid login payload", () => {
    expect(
      LoginSchema.safeParse({ username: "j.rivas", password: "a" }).success,
    ).toBe(true);
  });

  it("rejects an invalid username or an empty password", () => {
    expect(LoginSchema.safeParse({ username: "J.Rivas", password: "a" }).success).toBe(
      false,
    );
    expect(LoginSchema.safeParse({ username: "j.rivas", password: "" }).success).toBe(
      false,
    );
  });
});

describe("sessionSchema", () => {
  const validSession = {
    user: { id: "u-1", username: "m.rivas", role: "coordinador" },
    expiresAt: "2099-01-01T00:00:00Z",
  };

  it("accepts a valid session wire shape", () => {
    expect(sessionSchema.safeParse(validSession).success).toBe(true);
  });

  it("rejects unknown roles and extra properties", () => {
    expect(
      sessionSchema.safeParse({
        ...validSession,
        user: { ...validSession.user, role: "superuser" },
      }).success,
    ).toBe(false);
    expect(
      sessionSchema.safeParse({ ...validSession, extra: true }).success,
    ).toBe(false);
  });
});

describe("userSchema", () => {
  const validUser = {
    id: "u-1",
    username: "m.rivas",
    email: "maria@correo.com",
    givenName: "María",
    familyName: "Rivas",
    role: "coordinador",
    createdAt: "2026-09-01T00:00:00Z",
  };

  it("accepts a required-only user and optional bio/avatarUrl", () => {
    expect(userSchema.safeParse(validUser).success).toBe(true);
    expect(
      userSchema.safeParse({ ...validUser, bio: null, avatarUrl: null }).success,
    ).toBe(true);
  });

  it("rejects missing required fields and unknown roles", () => {
    const { email: _email, ...withoutEmail } = validUser;
    expect(userSchema.safeParse(withoutEmail).success).toBe(false);
    expect(
      userSchema.safeParse({ ...validUser, role: "root" }).success,
    ).toBe(false);
  });
});

describe("SetUserRoleSchema", () => {
  it("accepts the three roles and rejects others", () => {
    expect(SetUserRoleSchema.safeParse({ role: "coordinador" }).success).toBe(true);
    expect(SetUserRoleSchema.safeParse({ role: "aprobador" }).success).toBe(true);
    expect(SetUserRoleSchema.safeParse({ role: "admin_sistema" }).success).toBe(true);
    expect(SetUserRoleSchema.safeParse({ role: "superuser" }).success).toBe(false);
  });
});
