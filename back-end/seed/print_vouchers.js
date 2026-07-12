import mongoose from "mongoose";
import dotenv from "dotenv";
import Voucher from "../src/modules/vouchers/voucher.model.js";

dotenv.config();

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_CONNECTIONSTRING;
    await mongoose.connect(mongoUri);
    const vouchers = await Voucher.find();
    console.log("VOUCHERS IN DB:", JSON.stringify(vouchers, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
