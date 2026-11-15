import "dotenv/config";
import mongoose from "mongoose";

const APPLY_FLAG = "--apply";
const environment = process.env.NODE_ENV || "development";
const isApply = process.argv.includes(APPLY_FLAG);
const connectionString =
  process.env.LOCAL_DEV_MONGO_URI ||
  process.env.MONGO_CONNECTIONSTRING;

const stop = async (message, exitCode = 1) => {
  console.error(message);
  await mongoose.disconnect().catch(() => {});
  process.exit(exitCode);
};

const run = async () => {
  if (!connectionString) {
    await stop("MONGO_CONNECTIONSTRING (hoặc LOCAL_DEV_MONGO_URI) là bắt buộc.");
  }

  await mongoose.connect(connectionString);
  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: "sessions" }).toArray();

  if (collections.length === 0) {
    console.log("Collection sessions không tồn tại; không có gì cần làm.");
    await mongoose.disconnect();
    return;
  }

  if (!isApply) {
    console.log(`[DRY RUN] Sẽ xóa collection sessions trong môi trường ${environment}.`);
    console.log(`Để thực thi, hãy backup DB rồi chạy: NODE_ENV=${environment} MIGRATION_ENV_CONFIRM=${environment} MIGRATION_BACKUP_CONFIRMED=yes node src/scripts/drop-legacy-sessions-collection.js --apply`);
    await mongoose.disconnect();
    return;
  }

  if (process.env.MIGRATION_ENV_CONFIRM !== environment) {
    await stop(`Từ chối: MIGRATION_ENV_CONFIRM phải chính xác là "${environment}".`);
  }
  if (process.env.MIGRATION_BACKUP_CONFIRMED !== "yes") {
    await stop("Từ chối: hãy backup DB và đặt MIGRATION_BACKUP_CONFIRMED=yes.");
  }

  await db.dropCollection("sessions");
  console.log("Collection sessions cũ đã được xóa.");
  await mongoose.disconnect();
};

run().catch(async (error) => {
  await stop(`Migration thất bại: ${error.message}`);
});
