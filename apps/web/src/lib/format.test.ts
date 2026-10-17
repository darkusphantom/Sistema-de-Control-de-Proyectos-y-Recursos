import { describe, expect, it } from "vitest";
import { formatDate, truncateText } from "./format";

describe("formatDate", () => {
  it("formats a valid ISO date in Spanish by default", () => {
    expect(formatDate("2026-03-12")).toBe("12 mar 2026");
  });

  it("formats a date with a custom locale", () => {
    expect(formatDate("2026-03-12", "en-US")).toBe("Mar 12, 2026");
  });

  it("returns 'Invalid date' for an unparseable input", () => {
    expect(formatDate("not-a-date")).toBe("Invalid date");
  });
});

describe("truncateText", () => {
  it("returns the text unchanged when it fits within the limit", () => {
    expect(truncateText("short text")).toBe("short text");
  });

  it("truncates long text and appends an ellipsis", () => {
    expect(truncateText("a".repeat(200), 160)).toBe(`${"a".repeat(160)}…`);
  });

  it("trims trailing whitespace before appending the ellipsis", () => {
    expect(truncateText("hello  world", 7)).toBe("hello…");
  });
});
