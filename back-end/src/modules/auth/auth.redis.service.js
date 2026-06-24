import { getRedisConnection } from "../../configs/redis.js";
import logger from "../../common/logger.js";

const ACCESS_TTL = 60 * 30; // 30 minutes
const REFRESH_TTL = 60 * 60 * 24 * 30; // 30 days
const BLACKLIST_TTL = ACCESS_TTL;

export async function whitelistAccess(jti, userId) {
  const redis = getRedisConnection();
  try {
    await redis.set(`at:${jti}`, String(userId), "EX", ACCESS_TTL);
  } catch (err) {
    logger.error("whitelistAccess error: %s", err);
    throw err;
  }
}

export async function isAccessValid(jti, userId) {
  if (!jti || !userId) return false;

  const redis = getRedisConnection();
  const blacklisted = await redis.exists(`auth:blacklist:${jti}`);
  if (blacklisted) return false;

  const whitelistedUserId = await redis.get(`at:${jti}`);
  return whitelistedUserId === String(userId);
}

export async function storeRefreshSession(sessionId, payload) {
  const redis = getRedisConnection();
  const key = `auth:refresh:${sessionId}`;
  try {
    await redis.hmset(key, {
      userId: payload.userId,
      jti: payload.jti,
      createdAt: Date.now(),
      expiresAt: Date.now() + REFRESH_TTL * 1000,
    });
    await redis.expire(key, REFRESH_TTL);
  } catch (err) {
    logger.error("storeRefreshSession error: %s", err);
    throw err;
  }
}

export async function getRefreshSession(sessionId) {
  const redis = getRedisConnection();
  const data = await redis.hgetall(`auth:refresh:${sessionId}`);
  return Object.keys(data).length ? data : null;
}

export async function blacklistToken(jti) {
  if (!jti) return;

  const redis = getRedisConnection();
  await redis.del(`at:${jti}`);
  await redis.set(`auth:blacklist:${jti}`, "1", "EX", BLACKLIST_TTL);
}

export async function purgeUserTokens(userId) {
  if (!userId) return;

  const redis = getRedisConnection();
  const stream = redis.scanStream({ match: `sess:${userId}:*` });

  for await (const sessionKeys of stream) {
    for (const sessionKey of sessionKeys) {
      const sessionData = await redis.get(sessionKey);
      const parts = sessionKey.split(":");

      if (parts.length === 3) {
        await redis.del(`at:${parts[2]}`);
      }

      if (sessionData) {
        try {
          const parsedSession = JSON.parse(sessionData);
          if (parsedSession.refreshToken) {
            await redis.del(`rt:${parsedSession.refreshToken}`);
          }
        } catch (err) {
          logger.warn("purgeUserTokens session parse error: %s", err);
        }
      }

      await redis.del(sessionKey);
    }
  }
}
