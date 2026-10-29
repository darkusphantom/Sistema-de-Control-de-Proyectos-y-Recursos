import { describe, expect, it } from "vitest";
import { DEV_AUTH_SECRET, parseEnv } from "./env";

describe("parseEnv", () => {
  it("applies the documented defaults when nothing is provided", () => {
    const env = parseEnv({});
    expect(env.NODE_ENV).toBe("development");
    expect(env.PORT).toBe(3001);
    expect(env.HOST).toBe("0.0.0.0");
    expect(env.CORS_ORIGINS).toBe("http://localhost:3000");
    expect(env.MAX_BODY_BYTES).toBe(102_400);
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.BETTER_AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(env.BETTER_AUTH_URL).toBe("http://localhost:3001");
    expect(env.RATE_LIMIT_MAX).toBe(100);
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(60_000);
    expect(env.OPENAPI_ENABLED).toBe(false);
  });

  it("parses a fully provided source into a typed environment", () => {
    const env = parseEnv({
      NODE_ENV: "production",
      PORT: "4000",
      HOST: "127.0.0.1",
      CORS_ORIGINS: "https://red.facyt.edu.ve, https://api.red.facyt.edu.ve",
      MAX_BODY_BYTES: "2048",
      LOG_LEVEL: "debug",
      BETTER_AUTH_SECRET: "a".repeat(64),
      BETTER_AUTH_URL: "https://api.red.facyt.edu.ve",
      RATE_LIMIT_MAX: "50",
      RATE_LIMIT_WINDOW_MS: "30000",
      OPENAPI_ENABLED: "false",
    });
    expect(env.NODE_ENV).toBe("production");
    expect(env.PORT).toBe(4000);
    expect(env.HOST).toBe("127.0.0.1");
    expect(env.CORS_ORIGINS).toBe(
      "https://red.facyt.edu.ve, https://api.red.facyt.edu.ve",
    );
    expect(env.MAX_BODY_BYTES).toBe(2048);
    expect(env.LOG_LEVEL).toBe("debug");
    expect(env.BETTER_AUTH_URL).toBe("https://api.red.facyt.edu.ve");
    expect(env.RATE_LIMIT_MAX).toBe(50);
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(30_000);
    expect(env.OPENAPI_ENABLED).toBe(false);
  });

  it("fails fast when CORS_ORIGINS is missing in production", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        BETTER_AUTH_SECRET: "a".repeat(64),
        BETTER_AUTH_URL: "https://api.example.com",
        RATE_LIMIT_MAX: "50",
        RATE_LIMIT_WINDOW_MS: "30000",
      }),
    ).toThrow(/CORS_ORIGINS/);
  });

  it("fails fast when BETTER_AUTH_SECRET is missing in production", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        CORS_ORIGINS: "http://localhost:3000",
        BETTER_AUTH_URL: "https://api.example.com",
        RATE_LIMIT_MAX: "50",
        RATE_LIMIT_WINDOW_MS: "30000",
      }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it("fails fast when RATE_LIMIT keys are missing in production", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        CORS_ORIGINS: "http://localhost:3000",
        BETTER_AUTH_SECRET: "a".repeat(64),
        BETTER_AUTH_URL: "https://api.example.com",
      }),
    ).toThrow(/RATE_LIMIT_MAX/);
  });

  it("rejects the documented development secret in production", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        CORS_ORIGINS: "https://red.facyt.edu.ve",
        BETTER_AUTH_SECRET: DEV_AUTH_SECRET,
        BETTER_AUTH_URL: "https://api.red.facyt.edu.ve",
        RATE_LIMIT_MAX: "100",
        RATE_LIMIT_WINDOW_MS: "60000",
      }),
    ).toThrow(/BETTER_AUTH_SECRET must not be the documented development secret/);
  });

  it("keeps OpenAPI disabled unless explicitly enabled", () => {
    expect(parseEnv({ OPENAPI_ENABLED: "true" }).OPENAPI_ENABLED).toBe(true);
  });

  it("rejects a BETTER_AUTH_SECRET shorter than 32 bytes", () => {
    expect(() =>
      parseEnv({ BETTER_AUTH_SECRET: "too-short" }),
    ).toThrow(/Invalid environment/);
  });

  it("allows production env when all required keys are present", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        CORS_ORIGINS: "https://red.facyt.edu.ve",
        BETTER_AUTH_SECRET: "a".repeat(64),
        BETTER_AUTH_URL: "https://api.red.facyt.edu.ve",
        RATE_LIMIT_MAX: "100",
        RATE_LIMIT_WINDOW_MS: "60000",
      }),
    ).not.toThrow();
  });

  it("allows CORS_ORIGINS to be absent outside production", () => {
    expect(() => parseEnv({ NODE_ENV: "test" })).not.toThrow();
  });

  it("fails fast on a non-numeric PORT", () => {
    expect(() => parseEnv({ PORT: "not-a-number" })).toThrow(/Invalid environment/);
  });

  it("fails fast on an unknown NODE_ENV", () => {
    expect(() => parseEnv({ NODE_ENV: "staging" })).toThrow(/Invalid environment/);
  });

  it("fails fast on an invalid LOG_LEVEL", () => {
    expect(() => parseEnv({ LOG_LEVEL: "verbose" })).toThrow(/Invalid environment/);
  });

  it("fails fast on a whitespace-only CORS_ORIGINS", () => {
    expect(() => parseEnv({ CORS_ORIGINS: "   " })).toThrow(/Invalid environment/);
  });

  it("keeps DATABASE_URL as an optional reserved key", () => {
    const withDb = parseEnv({ DATABASE_URL: "postgresql://localhost:5432/red_facyt" });
    expect(withDb.DATABASE_URL).toBe("postgresql://localhost:5432/red_facyt");
    const withoutDb = parseEnv({});
    expect(withoutDb.DATABASE_URL).toBeUndefined();
  });
});