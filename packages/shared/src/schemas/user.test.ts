import { describe, expect, it } from "vitest";
import { userOptionSchema } from "./user";

describe("userOptionSchema", () => {
  it("accepts a light user option (id, username, fullName)", () => {
    expect(
      userOptionSchema.safeParse({
        id: "u-1",
        username: "m.rivas",
        fullName: "María Rivas",
      }).success,
    ).toBe(true);
  });

  it("rejects missing fields and extra properties (strict)", () => {
    expect(
      userOptionSchema.safeParse({ id: "u-1", username: "m.rivas" }).success,
    ).toBe(false);
    expect(
      userOptionSchema.safeParse({
        id: "u-1",
        username: "m.rivas",
        fullName: "María Rivas",
        email: "maria@correo.com",
      }).success,
    ).toBe(false);
  });
});
