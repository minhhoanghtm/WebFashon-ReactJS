import mongoose from "mongoose";
import dotenv from "dotenv";
import WebsiteSettings from "../modules/websiteSettings/websiteSettings.model.js";

dotenv.config();

const run = async () => {
  try {
    const connectionString = process.env.MONGO_CONNECTIONSTRING;
    await mongoose.connect(connectionString);
    console.log("Connected to MongoDB!");

    // Update settings logoUrl to empty
    const updated = await WebsiteSettings.findOneAndUpdate(
      { singletonKey: "default" },
      { $set: { "general.logoUrl": "" } },
      { new: true, upsert: true }
    );
    console.log("Website Settings Updated successfully!", updated.general);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Failed to reset logo:", err);
    await mongoose.disconnect();
  }
};

run();
