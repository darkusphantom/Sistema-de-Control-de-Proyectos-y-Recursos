import { describe, expect, it } from "vitest";
import { parseCorsOrigins } from "./cors";

describe("parseCorsOrigins", () => {
  it("splits, trims and keeps valid origins in order", () => {
    expect(
      parseCorsOrigins("http://localhost:3000, https://red.facyt.edu.ve"),
    ).toEqual(["http://localhost:3000", "https://red.facyt.edu.ve"]);
  });

  it("normalizes a trailing slash and deduplicates entries", () => {
    expect(
      parseCorsOrigins(
        "https://red.facyt.edu.ve/, https://red.facyt.edu.ve, http://localhost:3000",
      ),
    ).toEqual(["https://red.facyt.edu.ve", "http://localhost:3000"]);
  });

  it("ignores empty entries", () => {
    expect(parseCorsOrigins("http://localhost:3000,,  ,")).toEqual([
      "http://localhost:3000",
    ]);
  });

  it("rejects a value that is not a URL", () => {
    expect(() => parseCorsOrigins("not-an-origin")).toThrow(
      /not a valid URL/,
    );
  });

  it("rejects a non-http(s) scheme", () => {
    expect(() => parseCorsOrigins("ftp://files.example")).toThrow(
      /must use http or https/,
    );
  });

  it("rejects an origin with a path", () => {
    expect(() => parseCorsOrigins("https://red.facyt.edu.ve/api")).toThrow(
      /must be an origin without path/,
    );
  });

  it("rejects an origin with embedded credentials", () => {
    expect(() => parseCorsOrigins("https://user:pass@red.facyt.edu.ve")).toThrow(
      /must be an origin without path/,
    );
  });
});
