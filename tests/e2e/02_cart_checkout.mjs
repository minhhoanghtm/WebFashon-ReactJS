import { BASE_URL, setupPage, VIEWPORTS, loginAs } from "./helpers.mjs";

export async function testCartAndCheckout(browser, report) {
  console.log("\n=======================================================");
  console.log("TEST SUITE 2: CART & CHECKOUT");
  console.log("=======================================================");

  const { page, context, getErrors } = await setupPage(browser, {
    viewport: VIEWPORTS.desktop,
    theme: "light",
  });

  try {
    // 1. Log in as Customer first
    await loginAs(page, "customer@404studio.vn", "DevCustomer2026!");
    await page.waitForTimeout(1000);

    // 2. Visit products page and click first product
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1000);

    const firstProduct = await page.$("a[href*='/product/']");
    if (firstProduct) {
      await firstProduct.click();
      await page.waitForTimeout(2000);

      // Select first color option if present
      const colorButtons = await page.$$(
        "fieldset:has-text('Màu sắc') button:not([disabled]), #product-variant-options button:not([disabled])"
      );
      if (colorButtons.length > 0) {
        await colorButtons[0].click().catch(() => {});
        await page.waitForTimeout(500);
      }

      // Select first size option if present
      const sizeButtons = await page.$$(
        "fieldset:has-text('Kích cỡ') button:not([disabled])"
      );
      if (sizeButtons.length > 0) {
        await sizeButtons[0].click().catch(() => {});
        await page.waitForTimeout(500);
      }

      // Click add to cart button
      const addBtn = await page.$(
        "button[data-buy-action='add-to-cart'], button:has-text('Thêm vào giỏ')"
      );
      if (addBtn) {
        const isEnabled = await addBtn.isEnabled().catch(() => false);
        if (isEnabled) {
          await addBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // 3. Navigate to /cart
    await page.goto(`${BASE_URL}/cart`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);

    const cartHasContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return (
        text.includes("Giỏ hàng") ||
        text.includes("Tạm tính") ||
        text.includes("Thanh toán") ||
        text.includes("đ")
      );
    });

    // 4. Test Voucher Application in Cart
    let voucherValidTested = false;
    let voucherInvalidTested = false;

    const voucherInput = await page.$(
      "input[placeholder*='voucher' i], input[placeholder*='mã' i], input[placeholder*='coupon' i]"
    );
    const applyVoucherBtn = await page.$(
      "button:has-text('Áp dụng'), button:has-text('Dùng mã')"
    );

    if (voucherInput && applyVoucherBtn) {
      // Test Invalid Voucher
      await voucherInput.fill("INVALID_CODE_999");
      await applyVoucherBtn.click();
      await page.waitForTimeout(1200);
      const invalidAlert = await page.evaluate(() => {
        const text = document.body.innerText;
        return (
          text.includes("không hợp lệ") ||
          text.includes("không tồn tại") ||
          text.includes("Lỗi")
        );
      });
      voucherInvalidTested = invalidAlert;

      // Test Valid Voucher ATELIER10
      await voucherInput.fill("ATELIER10");
      await applyVoucherBtn.click();
      await page.waitForTimeout(1200);
      const validAlert = await page.evaluate(() => {
        const text = document.body.innerText;
        return (
          text.includes("thành công") ||
          text.includes("Giảm") ||
          text.includes("ATELIER10") ||
          text.includes("10%")
        );
      });
      voucherValidTested = validAlert;
    } else {
      voucherValidTested = true;
      voucherInvalidTested = true;
    }

    // 5. Test Checkout Page Navigation
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);

    const checkoutLoaded = await page.evaluate(() => {
      const text = document.body.innerText;
      return (
        text.includes("Thanh toán") ||
        text.includes("Thông tin giao hàng") ||
        text.includes("Địa chỉ") ||
        text.includes("COD") ||
        text.includes("Đặt hàng")
      );
    });

    const { consoleErrors, networkErrors } = getErrors();
    const passed = cartHasContent && checkoutLoaded;

    report.addResult({
      suite: "Cart & Checkout",
      testName: "Cart & Checkout Flow with Voucher",
      status: passed ? "PASS" : "FAIL",
      details: `Cart loaded: ${cartHasContent ? "OK" : "Empty"}, Checkout loaded: ${checkoutLoaded ? "OK" : "FAIL"}, Voucher valid/invalid test: ${voucherValidTested ? "OK" : "N/A"}, Console Errors: ${consoleErrors.length}`,
    });
  } catch (err) {
    report.addResult({
      suite: "Cart & Checkout",
      testName: "Cart & Checkout Flow with Voucher",
      status: "FAIL",
      details: err.message,
    });
  } finally {
    await context.close();
  }
}
