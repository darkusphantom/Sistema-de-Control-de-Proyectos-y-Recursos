import { describe, it, expect } from "vitest";
import { canChangeRole } from "./moderation";

describe("moderation domain logic", () => {
  describe("canChangeRole", () => {
    it("returns false for 'admin' role", () => {
      expect(canChangeRole("admin")).toBe(false);
    });

    it("returns true for 'estudiante' role", () => {
      expect(canChangeRole("estudiante")).toBe(true);
    });

    it("returns true for 'profesor' role", () => {
      expect(canChangeRole("profesor")).toBe(true);
    });
  });
});
