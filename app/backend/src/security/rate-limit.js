import { createHash } from "node:crypto";

const DEFAULT_RESPONSE_BODY = Object.freeze({
  message: "Too many requests. Please retry later.",
  code: "RATE_LIMIT_EXCEEDED"
});

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function parseEnabledFlag(value, fallbackValue = true) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return fallbackValue;
  }
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function readRateLimitConfigFromEnv() {
  return {
    enabled: parseEnabledFlag(process.env.RATE_LIMIT_ENABLED, true),
    login: {
      maxRequests: parsePositiveInt(process.env.RATE_LIMIT_LOGIN_MAX_REQUESTS, 120),
      windowSeconds: parsePositiveInt(process.env.RATE_LIMIT_LOGIN_WINDOW_SECONDS, 60)
    },
    register: {
      maxRequests: parsePositiveInt(process.env.RATE_LIMIT_REGISTER_MAX_REQUESTS, 40),
      windowSeconds: parsePositiveInt(process.env.RATE_LIMIT_REGISTER_WINDOW_SECONDS, 300)
    },
    checkout: {
      maxRequests: parsePositiveInt(process.env.RATE_LIMIT_CHECKOUT_MAX_REQUESTS, 80),
      windowSeconds: parsePositiveInt(process.env.RATE_LIMIT_CHECKOUT_WINDOW_SECONDS, 60)
    }
  };
}

function hashIdentity(rawIdentity) {
  return createHash("sha256")
    .update(String(rawIdentity || "unknown"))
    .digest("hex")
    .slice(0, 12);
}

function normalizeIp(req) {
  const source = req.ip || req.socket?.remoteAddress || "unknown";
  return String(source || "unknown");
}

export function createRateLimiterStore(options = {}) {
  const nowMs = options.nowMs || (() => Date.now());
  const buckets = new Map();

  function evaluate({ scope, key, maxRequests, windowSeconds }) {
    const now = nowMs();
    const windowMs = windowSeconds * 1000;
    const bucketKey = `${scope}:${key}`;
    let bucket = buckets.get(bucketKey);

    if (!bucket || now >= bucket.resetAtMs) {
      bucket = { count: 0, resetAtMs: now + windowMs };
      buckets.set(bucketKey, bucket);
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAtMs - now) / 1000));
    if (bucket.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
        resetAtSeconds: Math.ceil(bucket.resetAtMs / 1000),
        currentCount: bucket.count
      };
    }

    bucket.count += 1;
    const remaining = Math.max(0, maxRequests - bucket.count);
    return {
      allowed: true,
      remaining,
      retryAfterSeconds,
      resetAtSeconds: Math.ceil(bucket.resetAtMs / 1000),
      currentCount: bucket.count
    };
  }

  function clear() {
    buckets.clear();
  }

  return {
    evaluate,
    clear
  };
}

export function createScopedRateLimitMiddleware({
  scope,
  maxRequests,
  windowSeconds,
  enabled,
  store,
  keyResolver,
  logEvent
}) {
  const localStore = store || createRateLimiterStore();
  const isEnabled = Boolean(enabled);
  const resolveKey = keyResolver || ((req) => normalizeIp(req));

  return function scopedRateLimitMiddleware(req, res, next) {
    if (!isEnabled) {
      next();
      return;
    }

    const identity = String(resolveKey(req) || normalizeIp(req));
    const result = localStore.evaluate({
      scope,
      key: identity,
      maxRequests,
      windowSeconds
    });

    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));
    res.setHeader("X-RateLimit-Reset", String(result.resetAtSeconds));

    if (result.allowed) {
      next();
      return;
    }

    res.setHeader("Retry-After", String(result.retryAfterSeconds));
    logEvent(req, "rate_limit.throttled", {
      scope,
      maxRequests,
      windowSeconds,
      retryAfterSeconds: result.retryAfterSeconds,
      identityHash: hashIdentity(identity),
      currentCount: result.currentCount
    });
    res.status(429).json({
      ...DEFAULT_RESPONSE_BODY,
      retryAfterSeconds: result.retryAfterSeconds
    });
  };
}
