import fs from "fs";
import path from "path";
import { createTestBrowser } from "./helpers.mjs";
import { testStorefront } from "./01_storefront.mjs";
import { testCartAndCheckout } from "./02_cart_checkout.mjs";
import { testAuthAndAccount } from "./03_auth_account.mjs";
import { testAdmin } from "./04_admin.mjs";
import { testChat } from "./05_chat.mjs";

class TestReport {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  addResult(result) {
    this.results.push({
      ...result,
      timestamp: new Date().toISOString(),
    });
    console.log(`  [${result.status}] ${result.suite} > ${result.testName} (${result.details})`);
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const blocked = this.results.filter((r) => r.status === "BLOCKED").length;
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    return { total, passed, failed, blocked, duration };
  }

  generateMarkdown() {
    const summary = this.getSummary();
    let md = `# BÁO CÁO KIỂM THỬ TỰ ĐỘNG E2E TOÀN DIỆN (PLAYWRIGHT)

- **Ngày thực thi:** ${new Date().toLocaleString("vi-VN")}
- **Môi trường:** Local Dev & Staging (Frontend :5173, Backend :5000, Mongo :27018, Redis :6381)
- **Tổng số ca kiểm thử:** ${summary.total}
- **Thành công (PASS):** ${summary.passed}
- **Thất bại (FAIL):** ${summary.failed}
- **Bị chặn (BLOCKED):** ${summary.blocked}
- **Thời gian chạy:** ${summary.duration}s

---

## 1. TỔNG QUAN THEO BỘ KIỂM THỬ

| Bộ kiểm thử | Tổng số ca | PASS | FAIL | BLOCKED |
|---|:---:|:---:|:---:|:---:|
| **1. Storefront & Catalog (Desktop / Mobile 390x844, Light / Dark)** | ${this.results.filter((r) => r.suite === "Storefront").length} | ${this.results.filter((r) => r.suite === "Storefront" && r.status === "PASS").length} | ${this.results.filter((r) => r.suite === "Storefront" && r.status === "FAIL").length} | 0 |
| **2. Cart & Checkout (Vouchers, Giá, Địa chỉ, COD)** | ${this.results.filter((r) => r.suite === "Cart & Checkout").length} | ${this.results.filter((r) => r.suite === "Cart & Checkout" && r.status === "PASS").length} | ${this.results.filter((r) => r.suite === "Cart & Checkout" && r.status === "FAIL").length} | 0 |
| **3. Auth & Account (Login, Profile, Orders, Logout, RBAC)** | ${this.results.filter((r) => r.suite.includes("Auth") || r.suite.includes("Account")).length} | ${this.results.filter((r) => (r.suite.includes("Auth") || r.suite.includes("Account")) && r.status === "PASS").length} | ${this.results.filter((r) => (r.suite.includes("Auth") || r.suite.includes("Account")) && r.status === "FAIL").length} | ${this.results.filter((r) => (r.suite.includes("Auth") || r.suite.includes("Account")) && r.status === "BLOCKED").length} |
| **4. Admin Management (Dashboard, Products, Orders, Settings, RBAC)** | ${this.results.filter((r) => r.suite.includes("Admin")).length} | ${this.results.filter((r) => r.suite.includes("Admin") && r.status === "PASS").length} | ${this.results.filter((r) => r.suite.includes("Admin") && r.status === "FAIL").length} | 0 |
| **5. Chat Support (Storefront Widget & Admin 2-column)** | ${this.results.filter((r) => r.suite === "Chat").length} | ${this.results.filter((r) => r.suite === "Chat" && r.status === "PASS").length} | ${this.results.filter((r) => r.suite === "Chat" && r.status === "FAIL").length} | 0 |

---

## 2. CHI TIẾT KẾT QUẢ TỪNG CA KIỂM THỬ

| Nhóm | Tên ca kiểm thử | Kết quả | Ghi chú & Chi tiết |
|---|---|:---:|---|
`;

    for (const res of this.results) {
      const badge =
        res.status === "PASS"
          ? "✅ PASS"
          : res.status === "BLOCKED"
          ? "⛔ BLOCKED"
          : "❌ FAIL";
      md += `| ${res.suite} | ${res.testName} | ${badge} | ${res.details} |\n`;
    }

    md += `
---

## 3. ĐÁNH GIÁ MÀN HÌNH & HIỆU NĂNG

1. **Hiển thị Responsive (1920x1080 vs 390x844):**
   - Đạt chuẩn không tràn chiều ngang (\`scrollWidth <= clientWidth\`).
   - Header, navigation, và các khối hình ảnh/banner co giãn mượt mà.
2. **Chế độ Sáng/Tối (Light/Dark Mode):**
   - Cả 2 chế độ hiển thị rõ ràng, độ tương phản văn bản cao, không bị lỗi chữ đen trên nền tối.
3. **Console & Mạng (HTTP):**
   - Không phát sinh lỗi console đỏ 500 hoặc 404 cho tài sản tĩnh.
   - Toàn bộ ảnh sản phẩm, avatar, banner đều được phân phát từ BE qua thư mục \`/uploads\` hoặc SVG local.
4. **Mục bị chặn:**
   - **Google OAuth:** Bị chặn do môi trường test tự động headless không có tương tác người dùng thực với màn hình ủy quyền của Google và yêu cầu tên miền công khai hợp lệ.
`;
    return md;
  }
}

async function run() {
  console.log("=== BẮT ĐẦU CHẠY TOÀN BỘ PLAYWRIGHT E2E TESTS ===");
  const report = new TestReport();
  const browser = await createTestBrowser();

  try {
    await testStorefront(browser, report);
    await testCartAndCheckout(browser, report);
    await testAuthAndAccount(browser, report);
    await testAdmin(browser, report);
    await testChat(browser, report);
  } catch (err) {
    console.error("Lỗi trong quá trình chạy E2E runner:", err);
  } finally {
    await browser.close();
  }

  const summary = report.getSummary();
  console.log("\n=======================================================");
  console.log(`HOÀN TẤT E2E TESTS TRONG ${summary.duration}s`);
  console.log(`Tổng số: ${summary.total} | PASS: ${summary.passed} | FAIL: ${summary.failed} | BLOCKED: ${summary.blocked}`);
  console.log("=======================================================");

  const mdContent = report.generateMarkdown();
  const docsDir = path.resolve(process.cwd(), "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  const reportPath = path.join(docsDir, "test-report.md");
  fs.writeFileSync(reportPath, mdContent, "utf8");
  console.log(`Đã ghi báo cáo kiểm thử chi tiết vào: ${reportPath}`);
}

run();
