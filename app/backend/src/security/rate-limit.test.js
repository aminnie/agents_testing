import test from "node:test";
import assert from "node:assert/strict";
import {
  createRateLimiterStore,
  createScopedRateLimitMiddleware
} from "./rate-limit.js";

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };
}

test("allows requests under threshold and throttles above threshold", () => {
  const store = createRateLimiterStore({ nowMs: () => 0 });
  const events = [];
  const middleware = createScopedRateLimitMiddleware({
    scope: "auth.login",
    maxRequests: 2,
    windowSeconds: 60,
    enabled: true,
    store,
    keyResolver: () => "127.0.0.1",
    logEvent: (_req, eventName, meta) => events.push({ eventName, meta })
  });

  const req = { ip: "127.0.0.1", method: "POST", originalUrl: "/api/login", correlationId: "corr-1" };

  let nextCalled = 0;
  middleware(req, createMockResponse(), () => {
    nextCalled += 1;
  });
  middleware(req, createMockResponse(), () => {
    nextCalled += 1;
  });

  const blockedResponse = createMockResponse();
  middleware(req, blockedResponse, () => {
    nextCalled += 1;
  });

  assert.equal(nextCalled, 2);
  assert.equal(blockedResponse.statusCode, 429);
  assert.equal(blockedResponse.payload?.code, "RATE_LIMIT_EXCEEDED");
  assert.ok(Number(blockedResponse.payload?.retryAfterSeconds) >= 1);
  assert.equal(events.length, 1);
  assert.equal(events[0]?.eventName, "rate_limit.throttled");
});

test("new window resets allowance", () => {
  let now = 0;
  const store = createRateLimiterStore({ nowMs: () => now });
  const middleware = createScopedRateLimitMiddleware({
    scope: "auth.register",
    maxRequests: 1,
    windowSeconds: 1,
    enabled: true,
    store,
    keyResolver: () => "key-1",
    logEvent: () => {}
  });

  const req = { ip: "127.0.0.1", method: "POST", originalUrl: "/api/register", correlationId: "corr-2" };
  const first = createMockResponse();
  let proceeded = false;
  middleware(req, first, () => {
    proceeded = true;
  });
  assert.equal(proceeded, true);

  const blocked = createMockResponse();
  middleware(req, blocked, () => {});
  assert.equal(blocked.statusCode, 429);

  now = 1500;
  const afterReset = createMockResponse();
  proceeded = false;
  middleware(req, afterReset, () => {
    proceeded = true;
  });
  assert.equal(proceeded, true);
});

test("disabled limiter always allows requests", () => {
  const middleware = createScopedRateLimitMiddleware({
    scope: "checkout",
    maxRequests: 1,
    windowSeconds: 60,
    enabled: false,
    keyResolver: () => "key-disabled",
    logEvent: () => {}
  });

  const req = { ip: "127.0.0.1", method: "POST", originalUrl: "/api/checkout", correlationId: "corr-3" };
  const res = createMockResponse();
  let proceeded = false;
  middleware(req, res, () => {
    proceeded = true;
  });
  assert.equal(proceeded, true);
  assert.equal(res.statusCode, 200);
});
