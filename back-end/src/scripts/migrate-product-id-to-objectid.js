import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";

dotenv.config();

const BATCH_SIZE = 100;

const migrateProductIdToObjectId = async () => {
  const isApply = process.argv.includes("--apply");

  console.log("================================================================");
  console.log(" MIGRATION: CHUYEN PRODUCT_ID TU STRING/MIXED SANG OBJECTID");
  console.log(` CHE DO: ${isApply ? "APPLY (Ghi truc tiep vao DB)" : "DRY-RUN (Chi doc va mo phong, KHONG sua DB)"}`);
  console.log("================================================================\n");

  try {
    await connectDB();

    const orderItemsColl = mongoose.connection.collection("order_items");
    const reviewsColl = mongoose.connection.collection("reviews");

    // 1. Thong ke so luong truoc migration
    console.log("1. THONG KE SO BAN GHI CO product_id DANG STRING:");
    let orderItemsStringBefore = 0;
    let reviewsStringBefore = 0;

    try {
      orderItemsStringBefore = await orderItemsColl.countDocuments({
        product_id: { $type: "string" },
      });
    } catch (err) {
      if (err.code !== 26) throw err;
    }

    try {
      reviewsStringBefore = await reviewsColl.countDocuments({
        product_id: { $type: "string" },
      });
    } catch (err) {
      if (err.code !== 26) throw err;
    }

    console.log(`   - order_items: ${orderItemsStringBefore} ban ghi string.`);
    console.log(`   - reviews:     ${reviewsStringBefore} ban ghi string.\n`);

    if (orderItemsStringBefore === 0 && reviewsStringBefore === 0) {
      console.log("=> Tat ca ban ghi da la ObjectId (hoac chua co ban ghi string). Khong can migrate tiep.\n");
    }

    // 2. Xu ly collection order_items
    console.log("2. XU LY COLLECTION 'order_items':");
    let orderItemsMigrated = 0;
    let orderItemsSkipped = 0;
    let orderItemBatchOps = [];

    if (orderItemsStringBefore > 0) {
      const orderCursor = orderItemsColl.find({ product_id: { $type: "string" } });

      for await (const doc of orderCursor) {
        const rawId = doc.product_id;
        if (mongoose.Types.ObjectId.isValid(rawId)) {
          orderItemBatchOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: { product_id: new mongoose.Types.ObjectId(rawId) } },
            },
          });
          orderItemsMigrated++;
        } else {
          console.warn(`   [CANH BAO] order_item ID=${doc._id} co product_id="${rawId}" khong phai ObjectId hop le. Bo qua, khong xoa!`);
          orderItemsSkipped++;
        }

        if (orderItemBatchOps.length >= BATCH_SIZE) {
          if (isApply) {
            await orderItemsColl.bulkWrite(orderItemBatchOps);
          }
          orderItemBatchOps = [];
        }
      }

      if (orderItemBatchOps.length > 0) {
        if (isApply) {
          await orderItemsColl.bulkWrite(orderItemBatchOps);
        }
        orderItemBatchOps = [];
      }
    }

    console.log(`   => Ket qua order_items: Hop le=${orderItemsMigrated}, Bo qua=${orderItemsSkipped}.`);

    // 3. Xu ly collection reviews
    console.log("\n3. XU LY COLLECTION 'reviews':");
    let reviewsMigrated = 0;
    let reviewsSkipped = 0;
    let reviewBatchOps = [];

    if (reviewsStringBefore > 0) {
      const reviewCursor = reviewsColl.find({ product_id: { $type: "string" } });

      for await (const doc of reviewCursor) {
        const rawId = doc.product_id;
        if (mongoose.Types.ObjectId.isValid(rawId)) {
          reviewBatchOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: { product_id: new mongoose.Types.ObjectId(rawId) } },
            },
          });
          reviewsMigrated++;
        } else {
          console.warn(`   [CANH BAO] review ID=${doc._id} co product_id="${rawId}" khong phai ObjectId hop le. Bo qua, khong xoa!`);
          reviewsSkipped++;
        }

        if (reviewBatchOps.length >= BATCH_SIZE) {
          if (isApply) {
            await reviewsColl.bulkWrite(reviewBatchOps);
          }
          reviewBatchOps = [];
        }
      }

      if (reviewBatchOps.length > 0) {
        if (isApply) {
          await reviewsColl.bulkWrite(reviewBatchOps);
        }
        reviewBatchOps = [];
      }
    }

    console.log(`   => Ket qua reviews: Hop le=${reviewsMigrated}, Bo qua=${reviewsSkipped}.`);

    // 4. Kiem tra doi chieu sau migration
    console.log("\n4. DOI CHIEU SO LIEU:");
    if (isApply) {
      const orderItemsStringAfter = await orderItemsColl.countDocuments({
        product_id: { $type: "string" },
      });
      const reviewsStringAfter = await reviewsColl.countDocuments({
        product_id: { $type: "string" },
      });

      console.log(`   - order_items con lai dang string: ${orderItemsStringAfter} (Ban dau: ${orderItemsStringBefore})`);
      console.log(`   - reviews con lai dang string:     ${reviewsStringAfter} (Ban dau: ${reviewsStringBefore})`);

      if (orderItemsStringAfter === 0 && reviewsStringAfter === 0) {
        console.log("\n=> [HOAN TAT] Migration thanh cong 100%! Khong con ban ghi string nao.");
      } else {
        console.log(`\n=> [LUU Y] Con lai ${orderItemsStringAfter + reviewsStringAfter} ban ghi khong the convert do ID khong hop le.`);
      }
    } else {
      console.log("   [DRY-RUN] Chua thuc hien ghi DB.");
      console.log(`   Du kien se chuyen doi ${orderItemsMigrated} order_items va ${reviewsMigrated} reviews sang ObjectId.`);
      console.log("\n   Chay lai lenh voi co --apply de thuc thi vao database:");
      console.log("   node src/scripts/migrate-product-id-to-objectid.js --apply\n");
    }

    // 5. In huong dan Backup & Rollback
    console.log("================================================================");
    console.log(" HUONG DAN BACKUP (mongodump) VA ROLLBACK (mongorestore)");
    console.log("================================================================");
    console.log(`
1. Truoc khi chay --apply, sao luu 2 collection bang mongodump:
   mongodump --uri="<MONGO_URI>" --collection=order_items --out=backup_$(date +%Y%m%d_%H%M%S)
   mongodump --uri="<MONGO_URI>" --collection=reviews --out=backup_$(date +%Y%m%d_%H%M%S)

2. Neu can rollback ve trang thai cu:
   mongorestore --uri="<MONGO_URI>" --drop backup_<TIMESTAMP>/<DB_NAME>/order_items.bson
   mongorestore --uri="<MONGO_URI>" --drop backup_<TIMESTAMP>/<DB_NAME>/reviews.bson
`);
  } catch (error) {
    console.error("Loi trong qua trinh migration:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Da dong ket noi MongoDB.");
  }
};

migrateProductIdToObjectId();
