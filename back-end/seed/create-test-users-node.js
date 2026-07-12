import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/modules/users/user.model.js";

dotenv.config();

const run = async () => {
  try {
    const connectionString = process.env.MONGO_CONNECTIONSTRING;
    console.log("Connecting to:", connectionString);
    await mongoose.connect(connectionString);
    console.log("Connected!");

    // Mật khẩu hash tương đương với "Minhhoang123"
    const PASSWORD_HASH = "$2b$10$J6dwrrWBA9ni.sIv9JZlM.Ept/C69eWSDj3WQ7GFCwEJVbdujLmIK";
    const users = [];

    for (let i = 1; i <= 1000; i++) {
      users.push({
        email: `loadtest${i}@gmail.com`,
        passWord: PASSWORD_HASH,
        fullName: `Load Test User ${i}`,
        birthday: new Date("2000-01-01"),
        sex: i % 2 === 0 ? "male" : "female",
        role: "user",
        status: "active",
        avatar_url: "https://cdn.sforum.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg",
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log("Deleting old loadtest users...");
    const deleteResult = await User.deleteMany({
      email: /^loadtest\d+@gmail\.com$/,
    });
    console.log(`Deleted ${deleteResult.deletedCount} old test users.`);

    console.log("Inserting 1000 test users...");
    const insertResult = await User.insertMany(users);
    console.log(`Successfully created ${insertResult.length} test users.`);

    await mongoose.disconnect();
    console.log("Done!");
  } catch (err) {
    console.error(err);
  }
};

run();
