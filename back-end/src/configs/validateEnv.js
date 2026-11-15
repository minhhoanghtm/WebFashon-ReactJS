import logger from "../common/logger.js";

/**
 * Validates critical environment variables upon server startup.
 * Enforces fail-fast behavior in production if mandatory secrets are missing.
 */
export const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const requiredInProduction = [
    { key: "MONGO_CONNECTIONSTRING", altKey: "MONGODB_URI" },
    { key: "ACCESS_TOKEN_SECRET" },
    { key: "REFRESH_TOKEN_SECRET" },
  ];

  const missing = [];

  for (const item of requiredInProduction) {
    const val = process.env[item.key] || (item.altKey ? process.env[item.altKey] : undefined);
    if (!val) {
      missing.push(item.key);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `❌ [Config] Missing required environment variables: ${missing.join(", ")}`;
    if (isProduction) {
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new Error(`Production startup aborted. ${errorMsg}`);
    } else {
      logger.warn(`⚠️ [Config] Missing non-production environment variables: ${missing.join(", ")}`);
    }
  }

  // Warn about weak secrets in production
  if (isProduction) {
    const secretsToCheck = ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];
    for (const secretKey of secretsToCheck) {
      const val = process.env[secretKey] || "";
      if (val.length < 32) {
        logger.warn(`⚠️ [Security] ${secretKey} is shorter than 32 characters. Consider using a 64-byte hex string in production.`);
      }
    }
  }

  return true;
};
