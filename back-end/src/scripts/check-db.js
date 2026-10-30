import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";

async function main() {
  const conn = await connectDB();
  console.log("Connected DB name:", conn.connection.name);
  const collections = await conn.connection.db.listCollections().toArray();
  for (const c of collections) {
    const count = await conn.connection.db.collection(c.name).countDocuments();
    console.log(`- ${c.name}: ${count}`);
  }
  await mongoose.disconnect();
}

main().catch(console.error);
