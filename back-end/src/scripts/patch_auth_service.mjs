import fs from 'fs';

const filePath = 'back-end/src/modules/auth/auth.service.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. In signOut, clean up rt:grace
const oldSignOut = `    if (refreshToken) {
      const hashedRt = hashToken(refreshToken);
      const sessionKey = await redis.get(\`rt:\${hashedRt}\`);
      if (sessionKey) {
        await redis.del(sessionKey);
        await redis.del(\`rt:\${hashedRt}\`);
      }
    }`;

const newSignOut = `    if (refreshToken) {
      const hashedRt = hashToken(refreshToken);
      const sessionKey = await redis.get(\`rt:\${hashedRt}\`);
      if (sessionKey) {
        await redis.del(sessionKey);
        await redis.del(\`rt:\${hashedRt}\`);
      }
      await redis.del(\`rt:grace:\${hashedRt}\`);
    }`;

content = content.replace(oldSignOut.replace(/\r\n/g, '\n'), newSignOut);
content = content.replace(oldSignOut.replace(/\n/g, '\r\n'), newSignOut.replace(/\n/g, '\r\n'));

// 2. In refreshAccessToken, check grace period
const oldCheck = `    const hashedRt = hashToken(refreshToken);
    const sessionKey = await redis.get(\`rt:\${hashedRt}\`);
    if (!sessionKey) {
      throw new AppError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn", 401);
    }`;

const newCheck = `    const hashedRt = hashToken(refreshToken);
    const sessionKey = await redis.get(\`rt:\${hashedRt}\`);
    if (!sessionKey) {
      // Check 30s Grace Period for rotated tokens (handles multi-tab & concurrent requests race conditions)
      const graceStr = await redis.get(\`rt:grace:\${hashedRt}\`);
      if (graceStr) {
        try {
          const graceData = JSON.parse(graceStr);
          const user = await userRepository.findById(graceData.userId);
          if (user && user.status !== "blocked") {
            return {
              accessToken: graceData.accessToken,
              refreshToken: graceData.refreshToken,
              user,
            };
          }
        } catch {
          // Fall through to 401
        }
      }
      throw new AppError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn", 401);
    }`;

content = content.replace(oldCheck.replace(/\r\n/g, '\n'), newCheck);
content = content.replace(oldCheck.replace(/\n/g, '\r\n'), newCheck.replace(/\n/g, '\r\n'));

// 3. In refreshAccessToken, store in grace period
const oldPipeline = `    const pipeline = redis.pipeline();
    pipeline.del(sessionKey);
    pipeline.del(\`rt:\${hashedRt}\`);
    pipeline.set(newSessionKey, JSON.stringify(newSessionData), "EX", REFRESH_TOKEN_REDIS_TTL);`;

const newPipeline = `    const pipeline = redis.pipeline();
    pipeline.del(sessionKey);
    pipeline.del(\`rt:\${hashedRt}\`);
    // Store in grace period for 30s to allow concurrent in-flight requests and multi-tab synchronization
    pipeline.set(
      \`rt:grace:\${hashedRt}\`,
      JSON.stringify({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        userId: String(user._id),
      }),
      "EX",
      30
    );
    pipeline.set(newSessionKey, JSON.stringify(newSessionData), "EX", REFRESH_TOKEN_REDIS_TTL);`;

content = content.replace(oldPipeline.replace(/\r\n/g, '\n'), newPipeline);
content = content.replace(oldPipeline.replace(/\n/g, '\r\n'), newPipeline.replace(/\n/g, '\r\n'));

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched auth.service.js with Grace Period logic!');
