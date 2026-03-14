import { randomUUID } from "node:crypto";

const SENSITIVE_KEYWORDS = [
  "password",
  "authorization",
  "token",
  "secret",
  "apikey",
  "api_key",
  "cardnumber",
  "cvv"
];

function isSensitiveKey(key) {
  const normalized = String(key || "").toLowerCase();
  return SENSITIVE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function sanitizeValue(value, depth = 0) {
  if (value == null || depth > 4) {
    return value ?? null;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry, depth + 1));
  }

  if (typeof value === "object") {
    const output = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      output[key] = isSensitiveKey(key) ? "[REDACTED]" : sanitizeValue(nestedValue, depth + 1);
    }
    return output;
  }

  if (typeof value === "string") {
    return value.length > 1000 ? `${value.slice(0, 1000)}...` : value;
  }

  return value;
}

function writeLog(entry) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

function buildCommonFields(req) {
  return {
    correlationId: req?.correlationId || "",
    path: String(req?.originalUrl || req?.url || "").split("?")[0] || "",
    method: String(req?.method || "").toUpperCase()
  };
}

function normalizeCorrelationId(value) {
  const candidate = String(value || "").trim();
  if (!candidate) {
    return "";
  }
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(candidate)) {
    return "";
  }
  return candidate;
}

function createLogEntry({ level, category, message, req, meta }) {
  return {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    ...buildCommonFields(req),
    ...sanitizeValue(meta || {})
  };
}

export function correlationIdMiddleware(req, res, next) {
  const inboundCorrelationId = normalizeCorrelationId(req.headers["x-correlation-id"]);
  req.correlationId = inboundCorrelationId || randomUUID();
  res.setHeader("x-correlation-id", req.correlationId);
  next();
}

export function requestLoggingMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const elapsedNanos = process.hrtime.bigint() - startedAt;
    const durationMs = Number(elapsedNanos) / 1_000_000;
    writeLog(
      createLogEntry({
        level: "info",
        category: "request",
        message: "Request completed",
        req,
        meta: {
          statusCode: res.statusCode,
          durationMs: Number(durationMs.toFixed(3))
        }
      })
    );
  });
  next();
}

export function logEvent(req, eventName, meta = {}) {
  writeLog(
    createLogEntry({
      level: "info",
      category: "event",
      message: eventName,
      req,
      meta
    })
  );
}

export function logError(req, message, error, meta = {}) {
  writeLog(
    createLogEntry({
      level: "error",
      category: "error",
      message,
      req,
      meta: {
        ...meta,
        errorName: String(error?.name || "Error"),
        errorMessage: String(error?.message || "Unknown error")
      }
    })
  );
}

export function logSystemInfo(message, meta = {}) {
  writeLog(
    createLogEntry({
      level: "info",
      category: "system",
      message,
      req: null,
      meta
    })
  );
}

export function logSystemError(message, error, meta = {}) {
  writeLog(
    createLogEntry({
      level: "error",
      category: "system",
      message,
      req: null,
      meta: {
        ...meta,
        errorName: String(error?.name || "Error"),
        errorMessage: String(error?.message || "Unknown error")
      }
    })
  );
}
