import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { StaticUserRepository } from "./user-repository.static";
import { mockUsers } from "@/data/users";
import type { User } from "@/lib/types";

const originalUsers: User[] = mockUsers.map((user) => ({ ...user }));

beforeEach(() => {
  mockUsers.length = 0;
  mockUsers.push(...originalUsers.map((user) => ({ ...user })));
});

afterEach(() => {
  mockUsers.length = 0;
  mockUsers.push(...originalUsers);
});

describe("StaticUserRepository", () => {
  const repo = new StaticUserRepository();

  describe("findByUsername", () => {
    it("returns the matching user (case-insensitive)", async () => {
      const user = await repo.findByUsername("M.RIVAS");
      expect(user).not.toBeNull();
      expect(user?.username).toBe("m.rivas");
    });

    it("returns null for an unknown username", async () => {
      await expect(repo.findByUsername("nobody")).resolves.toBeNull();
    });

    it("returns a copy, not the stored reference", async () => {
      const user = await repo.findByUsername("m.rivas");
      expect(user).not.toBeNull();
      expect(user).not.toBe(
        mockUsers.find((u) => u.username === "m.rivas"),
      );
    });
  });

  describe("update", () => {
    it("applies the patch and returns the updated user", async () => {
      const target = originalUsers[0];
      const updated = await repo.update(target.id, {
        givenName: "Nombre Nuevo",
        bio: "Nueva biografía",
      });

      expect(updated).toMatchObject({
        id: target.id,
        givenName: "Nombre Nuevo",
        bio: "Nueva biografía",
      });
      expect(updated?.familyName).toBe(target.familyName);
    });

    it("persists the patch for subsequent reads", async () => {
      const target = originalUsers[0];
      await repo.update(target.id, { givenName: "Persistido" });
      const found = await repo.findByUsername(target.username);
      expect(found?.givenName).toBe("Persistido");
    });

    it("returns null for an unknown id", async () => {
      await expect(repo.update("u-missing", { givenName: "X" })).resolves.toBeNull();
    });

    it("keeps untouched fields when the patch omits them", async () => {
      const target = originalUsers[0];
      const updated = await repo.update(target.id, {});
      expect(updated).toMatchObject({
        email: target.email,
        role: target.role,
        username: target.username,
      });
    });
  });
});
