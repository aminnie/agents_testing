import { createClient } from "redis";

const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;
const DEFAULT_KEY_PREFIX = "store:session:";

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function createMemorySessionStore(options = {}) {
  const ttlSeconds = parsePositiveInt(options.ttlSeconds, DEFAULT_SESSION_TTL_SECONDS);
  const sessions = new Map();

  function now() {
    return Date.now();
  }

  function getExpiryDate() {
    return now() + ttlSeconds * 1000;
  }

  function cleanupIfExpired(token, record) {
    if (!record || record.expiresAt > now()) {
      return false;
    }
    sessions.delete(token);
    return true;
  }

  return {
    mode: "memory",
    ttlSeconds,
    async getUserId(token) {
      const record = sessions.get(token);
      if (!record || cleanupIfExpired(token, record)) {
        return null;
      }
      return record.userId;
    },
    async setUserId(token, userId) {
      sessions.set(token, {
        userId,
        expiresAt: getExpiryDate()
      });
    },
    async delete(token) {
      sessions.delete(token);
    },
    async health() {
      return { ok: true, mode: "memory" };
    },
    async disconnect() {
      sessions.clear();
    }
  };
}

function createRedisSessionStore(client, options = {}) {
  const ttlSeconds = parsePositiveInt(options.ttlSeconds, DEFAULT_SESSION_TTL_SECONDS);
  const keyPrefix = options.keyPrefix || DEFAULT_KEY_PREFIX;

  function keyForToken(token) {
    return `${keyPrefix}${token}`;
  }

  return {
    mode: "redis",
    ttlSeconds,
    async getUserId(token) {
      const userId = await client.get(keyForToken(token));
      return userId ? Number.parseInt(userId, 10) : null;
    },
    async setUserId(token, userId) {
      await client.set(keyForToken(token), String(userId), { EX: ttlSeconds });
    },
    async delete(token) {
      await client.del(keyForToken(token));
    },
    async health() {
      const pong = await client.ping();
      return { ok: pong === "PONG", mode: "redis" };
    },
    async disconnect() {
      await client.quit();
    }
  };
}

export async function initSessionStore() {
  const mode = String(process.env.SESSION_STORE_DRIVER || "auto").toLowerCase();
  const redisUrl = String(process.env.REDIS_URL || "").trim();
  const redisRequired = String(process.env.REDIS_REQUIRED || "false").toLowerCase() === "true";
  const ttlSeconds = parsePositiveInt(process.env.SESSION_TTL_SECONDS, DEFAULT_SESSION_TTL_SECONDS);
  const keyPrefix = String(process.env.SESSION_KEY_PREFIX || DEFAULT_KEY_PREFIX);

  const shouldTryRedis = mode === "redis" || (mode === "auto" && Boolean(redisUrl));
  if (!shouldTryRedis) {
    return createMemorySessionStore({ ttlSeconds });
  }

  if (!redisUrl) {
    throw new Error("SESSION_STORE_DRIVER=redis requires REDIS_URL");
  }

  const client = createClient({ url: redisUrl });
  client.on("error", () => {
    // Connection lifecycle errors are handled by caller via health checks and fallback.
  });

  try {
    await client.connect();
    return createRedisSessionStore(client, { ttlSeconds, keyPrefix });
  } catch (error) {
    if (redisRequired || mode === "redis") {
      throw error;
    }
    return createMemorySessionStore({ ttlSeconds });
  }
}
