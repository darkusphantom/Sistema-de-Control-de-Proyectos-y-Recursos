import { Writable } from "node:stream";
import { HTTPException } from "hono/http-exception";
import { pino } from "pino";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import type { Env } from "./config/env";
import { parseEnv } from "./config/env";
import { parseCorsOrigins } from "./middleware/cors";
import { ForbiddenError } from "./application/errors";
import { MemoryUserStore } from "./infrastructure/repositories/in-memory/user-store";

/**
 * Construye un entorno de prueba válido con overrides opcionales.
 * Incluye las claves de auth/rate-limit para que `createApp` construya la
 * instancia de Better Auth sin depender de `.env`.
 */
function buildTestEnv(overrides: Record<string, string> = {}): Env {
  return parseEnv({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    BETTER_AUTH_SECRET: "test-secret-0123456789abcdef0123456789abcdef-abcdef",
    BETTER_AUTH_URL: "http://localhost:3001",
    RATE_LIMIT_MAX: "100",
    RATE_LIMIT_WINDOW_MS: "60000",
    ...overrides,
  });
}

/**
 * Construye una app de prueba con un store limpio por test.
 */
function buildApp(overrides: Record<string, string> = {}) {
  return createApp({ env: buildTestEnv(overrides), store: new MemoryUserStore() });
}

describe("createApp", () => {
  it("responds 200 with { status: 'ok' } on GET /api/v1/health", async () => {
    const app = buildApp();
    const response = await app.request("/api/v1/health");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toMatchObject({ status: "ok" });
  });

  it("returns a JSON 404 for unknown routes without leaking internals", async () => {
    const app = buildApp();
    const response = await app.request("/api/v1/nonexistent");
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({
      error: "not_found",
      message: "Not found",
    });
  });

  it("emits security headers and never exposes X-Powered-By", async () => {
    const app = buildApp();
    const response = await app.request("/api/v1/health");
    expect(response.headers.get("strict-transport-security")).toBeTruthy();
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("content-security-policy")).toContain(
      "default-src 'none'",
    );
    expect(response.headers.get("x-powered-by")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("allows a CORS origin listed in the whitelist", async () => {
    const app = buildApp({ CORS_ORIGINS: "http://localhost:3000" });
    const response = await app.request("/api/v1/health", {
      headers: { Origin: "http://localhost:3000" },
    });
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3000",
    );
  });

  it("denies a CORS origin outside the whitelist", async () => {
    const app = buildApp({ CORS_ORIGINS: "http://localhost:3000" });
    const response = await app.request("/api/v1/health", {
      headers: { Origin: "https://evil.example" },
    });
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("rejects a null CORS origin", async () => {
    const app = buildApp({ CORS_ORIGINS: "http://localhost:3000" });
    const response = await app.request("/api/v1/health", {
      headers: { Origin: "null" },
    });
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("never uses a wildcard Access-Control-Allow-Origin", async () => {
    const app = buildApp({ CORS_ORIGINS: "http://localhost:3000" });
    const response = await app.request("/api/v1/health", {
      headers: { Origin: "http://localhost:3000" },
    });
    expect(response.headers.get("access-control-allow-origin")).not.toBe("*");
  });

  it("returns 413 when the request body exceeds MAX_BODY_BYTES", async () => {
    const app = buildApp({ MAX_BODY_BYTES: "64" });
    const payload = "x".repeat(128);
    const response = await app.request("/api/v1/health", {
      method: "POST",
      headers: {
        "content-length": String(payload.length),
        "content-type": "application/json",
      },
      body: payload,
    });
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ error: "payload_too_large" });
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(response.headers.get("content-security-policy")).toBeTruthy();
  });

  it("does not leak stack traces on 500 in production", async () => {
    const app = buildApp({
      NODE_ENV: "production",
      CORS_ORIGINS: "http://localhost:3000",
    });
    app.get("/boom", () => {
      throw new Error("internal db credentials");
    });
    const response = await app.request("/boom");
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: "internal_error",
      message: "Internal server error",
    });
    const text = JSON.stringify(body);
    expect(text).not.toContain("at ");
    expect(text).not.toContain("Error");
    expect(text).not.toContain("src/");
    expect(text).not.toContain("stack");
  });

  it("may include error detail in development but never stack frames", async () => {
    const app = buildApp({ NODE_ENV: "development" });
    app.get("/boom-dev", () => {
      throw new Error("boom detail");
    });
    const response = await app.request("/boom-dev");
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toMatchObject({ error: "internal_error", detail: "boom detail" });
    expect(JSON.stringify(body)).not.toContain("at ");
  });

  it("returns the HTTPException status and message instead of 500", async () => {
    const app = buildApp();
    app.get("/boom-http", () => {
      throw new HTTPException(400, { message: "Bad request" });
    });
    const response = await app.request("/boom-http");
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "http_error",
      message: "Bad request",
    });
  });

  it("maps AppError to its status and wire code", async () => {
    const app = buildApp();
    app.get("/boom-app", () => {
      throw new ForbiddenError("No tienes permiso");
    });
    const response = await app.request("/boom-app");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "forbidden",
      message: "No tienes permiso",
    });
  });

  it("logs unhandled errors with the request id from the context", async () => {
    const chunks: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(String(chunk));
        callback();
      },
    });
    const logger = pino({ level: "info" }, stream);
    const app = createApp({
      env: buildTestEnv(),
      store: new MemoryUserStore(),
      logger,
    });
    app.get("/boom-log", () => {
      throw new Error("kaboom");
    });
    const response = await app.request("/boom-log", {
      headers: { "x-request-id": "trace-1234" },
    });
    expect(response.status).toBe(500);
    expect(chunks.join("")).toContain('"requestId":"trace-1234"');
  });

  it("tags every response with an x-request-id", async () => {
    const app = buildApp();
    const response = await app.request("/api/v1/health");
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("reuses a well-formed incoming x-request-id", async () => {
    const app = buildApp();
    const response = await app.request("/api/v1/health", {
      headers: { "x-request-id": "trace-1234" },
    });
    expect(response.headers.get("x-request-id")).toBe("trace-1234");
  });

  it("replaces a malformed incoming x-request-id", async () => {
    const app = buildApp();
    const response = await app.request("/api/v1/health", {
      headers: { "x-request-id": "bad id !!" },
    });
    expect(response.headers.get("x-request-id")).toMatch(/^[a-zA-Z0-9-]{1,64}$/);
  });
});

describe("parseCorsOrigins", () => {
  it("splits, trims and drops empty entries from the CSV", () => {
    const origins = parseCorsOrigins(
      " http://a.example , , http://b.example ",
    );
    expect(origins).toEqual(["http://a.example", "http://b.example"]);
  });
});