import { describe, it, expect } from "vitest";
import { canChangeRole } from "./moderation";

describe("moderation domain logic", () => {
  describe("canChangeRole", () => {
    it("returns false for 'admin' role", () => {
      expect(canChangeRole("admin_sistema")).toBe(false);
    });

    it("returns true for 'coordinador' role", () => {
      expect(canChangeRole("coordinador")).toBe(true);
    });

    it("returns true for 'aprobador' role", () => {
      expect(canChangeRole("aprobador")).toBe(true);
    });
  });
});
