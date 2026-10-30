import { execSync } from "child_process";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const STAGING_COMPOSE_FILE = "docker-compose.staging.yml";
const STAGING_MONGO_LOCAL_URI = "mongodb://staging_admin:staging_secret@127.0.0.1:27018/webfashion_staging?authSource=admin";

export async function checkStagingInfrastructure() {
  console.log("=== CHECKING STAGING INFRASTRUCTURE ===");
  try {
    const dockerPs = execSync('docker ps --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"', { encoding: "utf8" });
    console.log("Active Docker Containers:\n" + dockerPs);

    const hasMongoStaging = dockerPs.includes("webfashion-mongo-staging");
    const hasRedisStaging = dockerPs.includes("webfashion-redis-staging");

    return {
      dockerRunning: true,
      hasMongoStaging,
      hasRedisStaging,
    };
  } catch (err) {
    console.warn("⚠️ Docker check failed or Docker daemon unavailable:", err.message);
    return {
      dockerRunning: false,
      hasMongoStaging: false,
      hasRedisStaging: false,
    };
  }
}

export async function startStagingDataLayer() {
  console.log("=== STARTING STAGING DATA LAYER (MONGO & REDIS) ===");
  try {
    execSync(`docker compose -f ${STAGING_COMPOSE_FILE} up -d mongo-staging redis-staging`, { stdio: "inherit" });
    console.log(" Staging data services started.");
    // Wait 4 seconds for Mongo initialization
    await new Promise((r) => setTimeout(r, 4000));
    return true;
  } catch (err) {
    console.error("❌ Failed to start staging containers:", err.message);
    return false;
  }
}

export async function stopStagingContainers() {
  console.log("=== STOPPING STAGING CONTAINERS ===");
  try {
    execSync(`docker compose -f ${STAGING_COMPOSE_FILE} down`, { stdio: "inherit" });
    console.log(" Staging containers stopped.");
    return true;
  } catch (err) {
    console.error("❌ Failed to stop staging containers:", err.message);
    return false;
  }
}

async function main() {
  const action = process.argv[2] || "status";
  if (action === "up") {
    await startStagingDataLayer();
    await checkStagingInfrastructure();
  } else if (action === "down") {
    await stopStagingContainers();
  } else {
    const status = await checkStagingInfrastructure();
    console.log("Staging Status:", JSON.stringify(status, null, 2));
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
