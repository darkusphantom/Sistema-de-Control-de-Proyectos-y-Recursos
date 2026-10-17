import { describe, expect, it } from "vitest";
import { authorOptionSchema } from "./user";

describe("authorOptionSchema", () => {
  it("accepts a light user option (id, username, fullName)", () => {
    expect(
      authorOptionSchema.safeParse({
        id: "u-1",
        username: "m.rivas",
        fullName: "María Rivas",
      }).success,
    ).toBe(true);
  });

  it("rejects missing fields and extra properties (strict)", () => {
    expect(
      authorOptionSchema.safeParse({ id: "u-1", username: "m.rivas" }).success,
    ).toBe(false);
    expect(
      authorOptionSchema.safeParse({
        id: "u-1",
        username: "m.rivas",
        fullName: "María Rivas",
        email: "maria@correo.com",
      }).success,
    ).toBe(false);
  });
});
