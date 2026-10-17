import { mockUsers } from "@/data/users";
import type { User } from "@/lib/types";
import type { UpdateProfilePatch, UserRepository } from "./user-repository";

/**
 * Static implementation of {@link UserRepository}.
 *
 * Reads from `src/data/users.ts` (in-memory mock). The interface is identical
 * to the future PostgreSQL implementation, so swapping adapters does not
 * require changes to callers (profile page, server actions, tests).
 */
export class StaticUserRepository implements UserRepository {
  /**
   * Looks up a user by username (case-insensitive).
   *
   * @param username - Username to search.
   * @returns A copy of the user, or `null`.
   * @complexity O(n) — linear scan of the mock array.
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = mockUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    return user ? { ...user } : null;
  }

  /**
   * Applies a personal-data patch to a mock user.
   *
   * @param id - Id of the user to update.
   * @param patch - Fields to update.
   * @returns The updated user, or `null` when the id does not exist.
   * @complexity O(n) — linear scan plus object spread.
   */
  async update(id: string, patch: UpdateProfilePatch): Promise<User | null> {
    const idx = mockUsers.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    const updatedUser = {
      ...mockUsers[idx],
      ...patch,
    };
    mockUsers[idx] = updatedUser;

    return { ...updatedUser };
  }
}
