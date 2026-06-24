import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../modules/users/user.model.js";

dotenv.config();

const run = async () => {
  try {
    const connectionString = process.env.MONGO_CONNECTIONSTRING;
    console.log("Connecting to:", connectionString);
    await mongoose.connect(connectionString);
    console.log("Connected!");
    
    const email = "khongcotien.2023@gmail.com";
    const user = await User.findOne({ email });
    console.log("User:", user);
    
    // check with lowercase / trim
    const normalized = email.toString().trim().toLowerCase().replace(/\s/g, "");
    console.log("Normalized:", normalized);
    const user2 = await User.findOne({ email: normalized });
    console.log("User with normalized email:", user2);
    
    // check all users in DB
    const allUsers = await User.find({}, { email: 1, _id: 1 });
    console.log("All users emails:", allUsers);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

run();
