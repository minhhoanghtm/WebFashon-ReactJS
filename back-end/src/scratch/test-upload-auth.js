import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { getRedisConnection } from "../configs/redis.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

import User from "../modules/users/user.model.js";

async function run() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  console.log("Connecting to database:", uri);
  await mongoose.connect(uri);

  // Find a user
  const user = await User.findOne({ role: "user" });
  if (!user) {
    console.error("No user with role 'user' found in DB!");
    await mongoose.disconnect();
    return;
  }
  console.log("Found user:", user.email, "role:", user.role, "ID:", user._id);

  // Generate JWT and whitelist in Redis
  const jti = "test-jti-upload-" + Date.now();
  const token = jwt.sign(
    { userId: user._id.toString(), jti },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );

  const redis = getRedisConnection();
  await redis.set(`at:${jti}`, user._id.toString(), "EX", 3600);
  console.log("Whitelisted token in Redis.");

  // Prepare file upload
  const fileContent = Buffer.from("dummy image content for upload testing");
  const blob = new Blob([fileContent], { type: "image/png" });
  const formData = new FormData();
  formData.append("image", blob, "test-avatar.png");

  console.log("Sending authenticated upload request to http://localhost:5000/api/upload ...");
  try {
    const res = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response text:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }

  // Cleanup Redis
  await redis.del(`at:${jti}`);
  await redis.quit();
  await mongoose.disconnect();
}

run().catch(console.error);
