import { getRedisConnection } from "../../../configs/redis.js";
import { AppError } from "../../../common/exceptions/AppError.js";
import logger from "../../../common/logger.js";

const DAILY_TOKEN_BUDGET = Number.parseInt(process.env.AI_CHAT_DAILY_TOKEN_BUDGET || "50000", 10);

const secondsUntilTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((tomorrow.getTime() - Date.now()) / 1000));
};

export const createAiTokenBudget = ({
  redisProvider = getRedisConnection,
  dailyBudget = DAILY_TOKEN_BUDGET,
  now = () => new Date(),
} = {}) => {
  const keyFor = (userId) => `ai-chat:token-budget:${now().toISOString().slice(0, 10)}:${userId}`;

  const unavailable = (error) => {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("Dịch vụ chat AI đang tạm thời bận. Vui lòng thử lại sau.", 503);
    }
    logger.warn("AI token budget unavailable outside production", { error: error.message });
  };

  return {
    async assertAvailable(userId) {
      if (!userId) return;
      try {
        const used = Number(await redisProvider().get(keyFor(userId)) || 0);
        if (used >= dailyBudget) {
          throw new AppError(
            "Bạn đã dùng hết lượt chat AI hôm nay. Vui lòng liên hệ nhân viên hỗ trợ nếu cần thêm trợ giúp.",
            429,
            "AI_DAILY_TOKEN_BUDGET_EXCEEDED",
          );
        }
      } catch (error) {
        if (error instanceof AppError) throw error;
        unavailable(error);
      }
    },

    async consume(userId, tokens) {
      if (!userId || !Number.isFinite(tokens) || tokens <= 0) return 0;
      try {
        const redis = redisProvider();
        const key = keyFor(userId);
        const total = await redis.incrby(key, Math.ceil(tokens));
        if (total === Math.ceil(tokens)) await redis.expire(key, secondsUntilTomorrow());
        return total;
      } catch (error) {
        unavailable(error);
        return 0;
      }
    },
  };
};

export default createAiTokenBudget();
