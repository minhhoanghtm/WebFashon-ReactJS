import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import PaymentTransaction from "../modules/payments/paymentTransaction.model.js";

dotenv.config();

const createUniquePaymentIndex = async () => {
  const isApply = process.argv.includes("--apply");

  console.log("==================================================");
  console.log(" KHOI TAO UNIQUE INDEX CHO PAYMENT TRANSACTIONS");
  console.log(` CHE DO: ${isApply ? "APPLY (Ghi index vao DB)" : "DRY-RUN (Chi kiem tra, khong sua DB)"}`);
  console.log("==================================================\n");

  try {
    await connectDB();

    console.log("1. Kiem tra cac ban ghi trung lap transaction_id theo provider...");
    let duplicates = [];
    try {
      duplicates = await PaymentTransaction.aggregate([
        {
          $match: {
            transaction_id: { $type: "string", $ne: "" },
          },
        },
        {
          $group: {
            _id: {
              provider: "$provider",
              transaction_id: "$transaction_id",
            },
            count: { $sum: 1 },
            records: {
              $push: {
                _id: "$_id",
                order_id: "$order_id",
                status: "$status",
                amount: "$amount",
                createdAt: "$createdAt",
              },
            },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ]);
    } catch (aggErr) {
      if (aggErr.code === 26 || aggErr.codeName === "NamespaceNotFound") {
        duplicates = [];
      } else {
        throw aggErr;
      }
    }

    if (duplicates.length > 0) {
      console.error(`\n[CANH BAO NGHIEP VU] Phat hien ${duplicates.length} nhom transaction_id bi trung lap!`);
      console.error("Danh sach chi tiet cac ban ghi trung lap de duyet tay (TUYET DOI khong tu dong xoa):");
      duplicates.forEach((group, idx) => {
        console.error(`\n--- Nhom ${idx + 1}: Provider="${group._id.provider}", TransactionID="${group._id.transaction_id}" (${group.count} ban ghi) ---`);
        group.records.forEach((rec) => {
          console.error(`   - _id: ${rec._id} | order_id: ${rec.order_id} | status: ${rec.status} | amount: ${rec.amount} | createdAt: ${rec.createdAt}`);
        });
      });

      console.error("\n=> [THAT BAI] Khong the tao unique index khi con du lieu trung lap.");
      console.error("Vui long xu ly thu cong cac ban ghi tren truoc khi chay lai script voi co --apply.\n");
      process.exitCode = 1;
      return;
    }

    console.log("=> Khong phat hien ban ghi nao bi trung lap transaction_id.");

    console.log("\n2. Kiem tra index hien co tren collection 'paymenttransactions'...");
    let existingIndexes = [];
    try {
      existingIndexes = await PaymentTransaction.collection.indexes();
    } catch (err) {
      if (err.code !== 26 && err.codeName !== "NamespaceNotFound") {
        throw err;
      }
      // Collection chua ton tai trong DB
    }

    const indexName = "provider_1_transaction_id_1";
    const alreadyExists = existingIndexes.some(
      (idx) => idx.name === indexName || (idx.key && idx.key.provider === 1 && idx.key.transaction_id === 1)
    );

    if (alreadyExists) {
      console.log(`=> Index { provider: 1, transaction_id: 1 } da ton tai tren MongoDB collection.`);
      return;
    }

    const indexSpec = { provider: 1, transaction_id: 1 };
    const indexOptions = {
      unique: true,
      partialFilterExpression: { transaction_id: { $type: "string" } },
      background: true,
      name: indexName,
    };

    if (!isApply) {
      console.log("\n[DRY-RUN] Script dang chay o che do kiem tra an toan.");
      console.log("Index du kien se duoc tao:");
      console.log("  - Keys:", JSON.stringify(indexSpec));
      console.log("  - Options:", JSON.stringify(indexOptions, null, 2));
      console.log("\nDe thuc su tao index vao database, hay chay lenh:");
      console.log("  node src/scripts/create-unique-payment-index.js --apply\n");
    } else {
      console.log("\n[APPLY] Dang tao unique index vao MongoDB...");
      const result = await PaymentTransaction.collection.createIndex(indexSpec, indexOptions);
      console.log(`=> [THANH CONG] Da tao index thanh cong voi ten: "${result}"\n`);
    }
  } catch (error) {
    console.error("Loi trong qua trinh kiem tra/tao index:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Da dong ket noi MongoDB.");
  }
};

createUniquePaymentIndex();
