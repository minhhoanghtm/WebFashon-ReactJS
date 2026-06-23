// src/modules/auth/auth.redis.service.js
import { getRedisConnection } from '../../configs/redis.js';
import logger from '../../common/logger.js';

const ACCESS_TTL = 60 * 15; // 15 minutes
const REFRESH_TTL = 60 * 60 * 24 * 30; // 30 days
const BLACKLIST_TTL = ACCESS_TTL;

/** Store whitelist entry for an access token (jti) */
export async function whitelistAccess(jti, userId) {
  const redis = getRedisConnection();
  try {
    await redis.set(`auth:access:${jti}`, userId, 'EX', ACCESS_TTL);
  } catch (err) {
    logger.error('whitelistAccess error: %s', err);
    throw err;
  }
}

/** Verify that a JWT jti is still valid (not black‑listed) */
export async function isAccessValid(jti) {
  const redis = getRedisConnection();
  const blacklisted = await redis.exists(`auth:blacklist:${jti}`);
  if (blacklisted) return false;
  const exists = await redis.exists(`auth:access:${jti}`);
  return !!exists;
}

/** Store refresh‑token session as a hash */
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
    logger.error('storeRefreshSession error: %s', err);
    throw err;
  }
}

/** Load a refresh session */
export async function getRefreshSession(sessionId) {
  const redis = getRedisConnection();
  const data = await redis.hgetall(`auth:refresh:${sessionId}`);
  return Object.keys(data).length ? data : null;
}

/** Black‑list a JWT (logout / rotation) */
export async function blacklistToken(jti) {
  const redis = getRedisConnection();
  await redis.set(`auth:blacklist:${jti}`, '1', 'EX', BLACKLIST_TTL);
}

/** Remove all tokens for a user (force logout) */
export async function purgeUserTokens(userId) {
  const redis = getRedisConnection();
  const stream = redis.scanStream({ match: 'auth:*' });
  for await (const keys of stream) {
    for (const key of keys) {
      const val = await redis.get(key);
      if (val === String(userId)) await redis.del(key);
    }
  }
}
