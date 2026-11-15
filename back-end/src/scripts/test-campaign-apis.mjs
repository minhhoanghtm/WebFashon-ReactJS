import "dotenv/config";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { connectDB } from "../configs/db.js";
import User from "../modules/users/user.model.js";
import Product from "../modules/products/product.model.js";
import Campaign from "../modules/campaigns/campaign.model.js";
import { whitelistAccess } from "../modules/auth/auth.redis.service.js";

const BACKEND_URL = "http://localhost:5000";

async function run() {
  console.log("==================================================================");
  console.log("🧪 TESTING ALL CAMPAIGN & FLASHSALE APIS");
  console.log("==================================================================");

  await connectDB();
  const admin = await User.findOne({ role: "admin" });
  if (!admin) throw new Error("No admin user found");

  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { userId: admin._id.toString(), role: admin.role, jti },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "30m" }
  );
  await whitelistAccess(jti, admin._id.toString());

  // 1. GET /api/campaigns/active
  console.log("\n👉 [1/6] GET /api/campaigns/active (Public)");
  const activeRes = await fetch(`${BACKEND_URL}/api/campaigns/active`);
  const activeData = await activeRes.json();
  if (activeRes.status === 200 && activeData.success) {
    console.log(`  ✅ Active campaigns returned 200 OK. Count: ${activeData.data.campaigns.length}`);
  } else {
    throw new Error(`Failed GET /api/campaigns/active: ${activeRes.status}`);
  }

  // 2. GET /api/campaigns (Public root)
  console.log("\n👉 [2/6] GET /api/campaigns (Public root)");
  const rootRes = await fetch(`${BACKEND_URL}/api/campaigns`);
  const rootData = await rootRes.json();
  if (rootRes.status === 200 && rootData.success) {
    console.log(`  ✅ Root /api/campaigns returned 200 OK.`);
  } else {
    throw new Error(`Failed GET /api/campaigns: ${rootRes.status}`);
  }

  // 3. GET /api/admin/campaigns
  console.log("\n👉 [3/6] GET /api/admin/campaigns (Admin)");
  const adminListRes = await fetch(`${BACKEND_URL}/api/admin/campaigns`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const adminListData = await adminListRes.json();
  if (adminListRes.status === 200 && adminListData.success) {
    console.log(`  ✅ Admin campaigns list returned 200 OK. Total: ${adminListData.data.pagination.total}`);
  } else {
    throw new Error(`Failed GET /api/admin/campaigns: ${adminListRes.status}`);
  }

  // 4. POST /api/admin/campaigns (Create)
  console.log("\n👉 [4/6] POST /api/admin/campaigns (Admin Create)");
  const testSlug = `flash-sale-auto-test-${Date.now()}`;
  const now = new Date();
  const end = new Date(Date.now() + 7 * 24 * 3600 * 1000);

  const createRes = await fetch(`${BACKEND_URL}/api/admin/campaigns`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Automated Flash Sale Test",
      slug: testSlug,
      type: "flash_sale",
      status: "active",
      startAt: now.toISOString(),
      endAt: end.toISOString(),
      priority: 5,
    }),
  });
  const createData = await createRes.json();
  if (createRes.status === 201 && createData.success) {
    console.log(`  ✅ Campaign created successfully with 201 Created. ID: ${createData.data._id}`);
  } else {
    throw new Error(`Failed POST /api/admin/campaigns: ${createRes.status} ${JSON.stringify(createData)}`);
  }
  const createdCampId = createData.data._id;

  // 5. GET /api/admin/campaigns/:id (Detail)
  console.log("\n👉 [5/6] GET /api/admin/campaigns/:id (Admin Detail)");
  const detailRes = await fetch(`${BACKEND_URL}/api/admin/campaigns/${createdCampId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const detailData = await detailRes.json();
  if (detailRes.status === 200 && detailData.success && detailData.data.campaign) {
    console.log(`  ✅ Campaign detail returned 200 OK. Name: "${detailData.data.campaign.name}"`);
  } else {
    throw new Error(`Failed GET /api/admin/campaigns/:id: ${detailRes.status}`);
  }

  // 6. Clean up: DELETE /api/admin/campaigns/:id
  console.log("\n👉 [6/6] DELETE /api/admin/campaigns/:id (Admin Cleanup)");
  const deleteRes = await fetch(`${BACKEND_URL}/api/admin/campaigns/${createdCampId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const deleteData = await deleteRes.json();
  if (deleteRes.status === 200 && deleteData.success) {
    console.log(`  ✅ Campaign soft-deleted cleanly.`);
  }

  // Hard delete the test campaign from DB to avoid cluttering dev data
  await Campaign.deleteOne({ _id: createdCampId });

  console.log("\n🎉 ALL CAMPAIGN & FLASHSALE APIS PASSED 100%!");
  process.exit(0);
}

run().catch((err) => {
  console.error("\n❌ Campaign API test failed:", err);
  process.exit(1);
});
