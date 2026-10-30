import Redis from "ioredis";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function audit() {
  console.log("=== RESOURCE OWNERSHIP & ISOLATION AUDIT ===\n");

  // 1. Redis 6379 (Host default / redis_local)
  console.log("1. Inspecting Redis 6379 (redis_local container):");
  try {
    const r6379 = new Redis({ host: "127.0.0.1", port: 6379, connectTimeout: 3000 });
    const keys6379 = await r6379.keys("*");
    console.log(`   Total keys on Redis 6379: ${keys6379.length}`);
    const keyPrefixes6379 = {};
    for (const k of keys6379) {
      const p = k.split(":")[0];
      keyPrefixes6379[p] = (keyPrefixes6379[p] || 0) + 1;
    }
    console.log("   Key prefixes on Redis 6379:", keyPrefixes6379);
    console.log("   Sample keys on Redis 6379:", keys6379.slice(0, 10));
    await r6379.quit();
  } catch (err) {
    console.log(`   Redis 6379 error: ${err.message}`);
  }

  // 2. Redis 6381 (webfashion-redis-staging container)
  console.log("\n2. Inspecting Redis 6381 (webfashion-redis-staging container):");
  try {
    const r6381 = new Redis({ host: "127.0.0.1", port: 6381, connectTimeout: 3000 });
    const ping = await r6381.ping();
    const keys6381 = await r6381.keys("*");
    console.log(`   Redis 6381 ping: ${ping}`);
    console.log(`   Total keys on Redis 6381: ${keys6381.length}`);
    const keyPrefixes6381 = {};
    for (const k of keys6381) {
      const p = k.split(":")[0];
      keyPrefixes6381[p] = (keyPrefixes6381[p] || 0) + 1;
    }
    console.log("   Key prefixes on Redis 6381:", keyPrefixes6381);
    console.log("   Sample keys on Redis 6381:", keys6381.slice(0, 10));
    await r6381.quit();
  } catch (err) {
    console.log(`   Redis 6381 error: ${err.message}`);
  }

  // 3. Local Dedicated Staging MongoDB 27018 (webfashion-mongo-staging)
  console.log("\n3. Inspecting MongoDB 27018 (webfashion-mongo-staging container):");
  try {
    const localUri = "mongodb://staging_admin:staging_secret@127.0.0.1:27018/webfashion_staging?authSource=admin";
    const connStaging = await mongoose.createConnection(localUri, { serverSelectionTimeoutMS: 3000 }).asPromise();
    console.log(`   Connected to local staging MongoDB: ${connStaging.name}`);
    const collectionsStaging = await connStaging.db.listCollections().toArray();
    console.log(`   Collections in webfashion_staging: ${collectionsStaging.map(c => c.name).join(", ") || "(none yet)"}`);
    await connStaging.close();
  } catch (err) {
    console.log(`   MongoDB 27018 error: ${err.message}`);
  }

  // 4. MongoDB Atlas (Default .env connection)
  console.log("\n4. Inspecting MongoDB Atlas (from .env):");
  try {
    const atlasUri = process.env.MONGO_CONNECTIONSTRING;
    const connAtlas = await mongoose.createConnection(atlasUri, { serverSelectionTimeoutMS: 5000 }).asPromise();
    console.log(`   Connected to Atlas Database: '${connAtlas.name}'`);
    const collectionsAtlas = await connAtlas.db.listCollections().toArray();
    console.log(`   Total collections in '${connAtlas.name}': ${collectionsAtlas.length}`);
    console.log(`   Collection names: ${collectionsAtlas.map(c => c.name).sort().join(", ")}`);
    
    // Check if there are foreign collections
    const webfashionCollections = [
      "users", "products", "orders", "categories", "carts", "coupons", "userevents", 
      "userinterestprofiles", "experiments", "experimentexposures", "chatmessages", 
      "conversations", "banners", "lookbooks", "pages", "reviews", "vouchers", 
      "websitesettings", "vector_embeddings"
    ];
    const foreignCollections = collectionsAtlas.filter(c => !webfashionCollections.includes(c.name));
    console.log(`   Collections potentially outside standard webfashion schema: ${foreignCollections.map(c => c.name).join(", ") || "(none)"}`);
    await connAtlas.close();
  } catch (err) {
    console.log(`   MongoDB Atlas error: ${err.message}`);
  }

  console.log("\n=== AUDIT COMPLETED ===");
  process.exit(0);
}

audit();
