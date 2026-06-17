import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".", ".env") });

const bannerSchema = new mongoose.Schema({}, { strict: false, collection: "banners" });
const Banner = mongoose.model("Banner", bannerSchema);

async function run() {
  const uri = process.env.MONGO_CONNECTIONSTRING;
  console.log("Connecting to MongoDB Atlas...");
  if (!uri) {
    console.error("MONGO_CONNECTIONSTRING is missing in env!");
    return;
  }
  await mongoose.connect(uri);
  console.log("Connected successfully!");

  const banners = await Banner.find({ isDeleted: { $ne: true } });
  console.log(`Banners in database (active/non-deleted): ${banners.length}\n`);
  
  for (const b of banners) {
    console.log(`- ID: ${b._id || b.id}`);
    console.log(`  Title: "${b.title}"`);
    console.log(`  Position: "${b.position}"`);
    console.log(`  isActive: ${b.isActive}`);
    console.log(`  Start Date: ${b.startDate}`);
    console.log(`  End Date: ${b.endDate}`);
    console.log(`  imageUrl: "${b.imageUrl}"`);
    console.log("-----------------------------------------");
  }
  await mongoose.disconnect();
}
run().catch(console.error);
