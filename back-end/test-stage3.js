import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./src/configs/db.js";

// Import để test trực tiếp nếu server không chạy, hoặc chúng ta test qua HTTP fetch
import User from "./src/modules/users/user.model.js";
dotenv.config({ path: "./.env" });

const API_BASE = "http://localhost:5000/api";

async function runHTTPTests() {
  console.log("🚀 Starting Stage 3 HTTP API Tests using native fetch...");
  console.log("======================================================");

  const testEmail = `test_stage3_${Date.now()}@gmail.com`;
  const testPassword = "Password123";

  // Test 1: SignUp Validator - Thiếu trường
  try {
    console.log("\n1. Testing SignUp Validator - Missing Fields...");
    const res = await fetch(`${API_BASE}/auth/signUp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }), // thiếu password, firstName, lastName
    });
    const data = await res.json();
    if (res.status === 400 && data.message.includes("Không thể thiếu")) {
      console.log("✅ Passed: Blocked by validator with 400 Bad Request");
    } else {
      console.log(`❌ Failed: Status ${res.status}, Message: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    console.log("❌ Failed to connect to server. Is the server running on port 5000?", e.message);
    return false;
  }

  // Test 2: SignUp Validator - Sai định dạng email
  try {
    console.log("\n2. Testing SignUp Validator - Invalid Email...");
    const res = await fetch(`${API_BASE}/auth/signUp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email",
        passWord: testPassword,
        firstName: "Test",
        lastName: "Stage3",
      }),
    });
    const data = await res.json();
    if (res.status === 400 && data.message.includes("Định dạng email không hợp lệ")) {
      console.log("✅ Passed: Blocked by validator with 400 Bad Request");
    } else {
      console.log(`❌ Failed: Status ${res.status}, Message: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    console.log("❌ Error:", e.message);
  }

  // Test 3: SignUp thành công & DTO kiểm tra
  let createdUser = null;
  try {
    console.log("\n3. Testing SignUp Success & SignUp DTO Filter...");
    const res = await fetch(`${API_BASE}/auth/signUp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        passWord: testPassword,
        firstName: "Test",
        lastName: "Stage3",
      }),
    });
    const result = await res.json();
    if (res.status === 201 && result.success) {
      createdUser = result.data;
      console.log("✅ Passed: Created successfully.");
      console.log("   DTO Response Output:", JSON.stringify(createdUser));
      // Kiểm tra xem DTO có lọc bỏ password không
      if (createdUser.passWord === undefined) {
        console.log("   ✅ DTO check: Password filtered out correctly.");
      } else {
        console.log("   ❌ DTO check: Password leaked!");
      }
    } else {
      console.log(`❌ Failed: Status ${res.status}, Message: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    console.log("❌ Error:", e.message);
  }

  // Test 4: SignIn thành công & Response gốc
  let token = null;
  try {
    console.log("\n4. Testing SignIn Success & Response check...");
    const res = await fetch(`${API_BASE}/auth/signIn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        passWord: testPassword,
      }),
    });
    const result = await res.json();
    if (res.status === 200 && result.success) {
      token = result.data.accessToken;
      console.log("✅ Passed: Logged in successfully.");
      console.log("   SignIn Response Output:", JSON.stringify(result.data));
      if (result.data.accessToken && result.data.user === undefined) {
        console.log("   ✅ Response check: Only accessToken returned, matches original API contract.");
      } else {
        console.log("   ❌ Response check: Unexpected data shape!");
      }
    } else {
      console.log(`❌ Failed: Status ${res.status}, Message: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    console.log("❌ Error:", e.message);
  }

  if (!token) {
    console.log("\nCannot proceed with AuthMe/Profile tests because sign in failed.");
    return;
  }

  // Test 5: Get Current User (authMe) & DTO
  try {
    console.log("\n5. Testing authMe & UserDTO...");
    const res = await fetch(`${API_BASE}/user/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await res.json();
    if (res.status === 200 && result.success) {
      console.log("✅ Passed: Fetched profile successfully.");
      console.log("   User DTO Output:", JSON.stringify(result.data));
      if (result.data.passWord === undefined) {
        console.log("   ✅ DTO check: Password filtered out correctly.");
      } else {
        console.log("   ❌ DTO check: Password leaked!");
      }
    } else {
      console.log(`❌ Failed: Status ${res.status}, Message: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    console.log("❌ Error:", e.message);
  }

  // Test 6: Update Profile với phone sai định dạng
  try {
    console.log("\n6. Testing UpdateProfile Validator - Invalid Phone...");
    const res = await fetch(`${API_BASE}/user/updateProfile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: "Updated Name",
        address: {
          fullName: "Recipient Name",
          phone: "invalid-phone",
          city: "Hanoi",
        },
      }),
    });
    const data = await res.json();
    if (res.status === 400 && data.message.includes("Số điện thoại trong địa chỉ không hợp lệ")) {
      console.log("✅ Passed: Blocked by validator with 400 Bad Request");
    } else {
      console.log(`❌ Failed: Status ${res.status}, Message: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    console.log("❌ Error:", e.message);
  }

  // Clean up user in DB
  try {
    console.log("\nCleaning up test user from DB...");
    await connectDB();
    await User.deleteOne({ email: testEmail });
    console.log("✅ Cleanup successful.");
  } catch (e) {
    console.log("❌ Failed to cleanup test user:", e.message);
  } finally {
    await mongoose.disconnect();
  }
}

runHTTPTests();
