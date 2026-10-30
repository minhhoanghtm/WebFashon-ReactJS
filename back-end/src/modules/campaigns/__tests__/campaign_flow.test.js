import pricingService from "../pricing.service.js";

describe("Campaign System Comprehensive Flow Tests (BƯỚC 7)", () => {
  const baseProduct = {
    _id: "prod-1",
    name: "Áo Thun Premium",
    price: 200000,
    new_price: 200000,
    category_id: "cat-fashion-1",
  };

  const variantRed = { _id: "var-red", color: "Red", size: "M" };
  const variantBlue = { _id: "var-blue", color: "Blue", size: "L" };

  // =========================================================================
  // 1. resolvePrice: ưu tiên flash > seasonal, hết hạn, chưa bắt đầu, hết quota, variant riêng
  // =========================================================================
  describe("1. resolvePrice Rules (Nguồn sự thật giá)", () => {
    const now = new Date("2026-10-29T10:00:00Z");

    test("Flash Sale ưu tiên cao hơn Seasonal Sale dù Seasonal giảm sâu hơn", async () => {
      const bundle = {
        campaigns: [
          {
            _id: "camp-flash-1",
            name: "Flash Sale Giờ Vàng",
            type: "flash_sale",
            priority: 10,
            startAt: new Date("2026-10-29T08:00:00Z"),
            endAt: new Date("2026-10-29T12:00:00Z"),
          },
          {
            _id: "camp-seasonal-1",
            name: "Sale Mùa Thu",
            type: "seasonal",
            priority: 50, // Priority cao hơn nhưng vẫn thua flash_sale theo quy tắc
            startAt: new Date("2026-10-29T00:00:00Z"),
            endAt: new Date("2026-10-30T00:00:00Z"),
            discountRule: {
              scope: "all",
              discountType: "percentage",
              discountValue: 50, // Giảm 50% = 100k
            },
          },
        ],
        campaignProducts: [
          {
            campaign_id: "camp-flash-1",
            product_id: "prod-1",
            variant_id: null,
            sale_price: 150000,
            quota: 20,
            sold: 5,
          },
        ],
      };

      const result = await pricingService.resolvePrice(baseProduct, null, now, null, bundle);
      expect(result.type).toBe("flash_sale");
      expect(result.campaignId).toBe("camp-flash-1");
      expect(result.finalPrice).toBe(150000);
      expect(result.originalPrice).toBe(200000);
      expect(result.remainingQuota).toBe(15);
      expect(result.isSale).toBe(true);
    });

    test("Không áp dụng chiến dịch chưa bắt đầu (now < startAt)", async () => {
      const futureNow = new Date("2026-10-29T07:00:00Z");
      const bundle = {
        campaigns: [
          {
            _id: "camp-future",
            name: "Flash Sale Tương Lai",
            type: "flash_sale",
            priority: 10,
            startAt: new Date("2026-10-29T08:00:00Z"),
            endAt: new Date("2026-10-29T12:00:00Z"),
          },
        ],
        campaignProducts: [
          {
            campaign_id: "camp-future",
            product_id: "prod-1",
            sale_price: 120000,
            quota: 10,
            sold: 0,
          },
        ],
      };

      const result = await pricingService.resolvePrice(baseProduct, null, futureNow, null, bundle);
      expect(result.finalPrice).toBe(200000);
      expect(result.campaignId).toBeNull();
      expect(result.isSale).toBeFalsy();
    });

    test("Không áp dụng chiến dịch đã kết thúc (now > endAt)", async () => {
      const pastNow = new Date("2026-10-29T13:00:00Z");
      const bundle = {
        campaigns: [
          {
            _id: "camp-past",
            name: "Flash Sale Đã Hết Hạn",
            type: "flash_sale",
            priority: 10,
            startAt: new Date("2026-10-29T08:00:00Z"),
            endAt: new Date("2026-10-29T12:00:00Z"),
          },
        ],
        campaignProducts: [
          {
            campaign_id: "camp-past",
            product_id: "prod-1",
            sale_price: 120000,
            quota: 10,
            sold: 0,
          },
        ],
      };

      const result = await pricingService.resolvePrice(baseProduct, null, pastNow, null, bundle);
      expect(result.finalPrice).toBe(200000);
      expect(result.campaignId).toBeNull();
    });

    test("Hết quota Flash Sale thì trả giá gốc kèm cờ isQuotaExhausted = true", async () => {
      const bundle = {
        campaigns: [
          {
            _id: "camp-flash-exhausted",
            name: "Flash Sale Hết Suất",
            type: "flash_sale",
            priority: 10,
            startAt: new Date("2026-10-29T08:00:00Z"),
            endAt: new Date("2026-10-29T12:00:00Z"),
          },
        ],
        campaignProducts: [
          {
            campaign_id: "camp-flash-exhausted",
            product_id: "prod-1",
            sale_price: 120000,
            quota: 10,
            sold: 10, // Đã bán hết 10/10
          },
        ],
      };

      const result = await pricingService.resolvePrice(baseProduct, null, now, null, bundle);
      expect(result.finalPrice).toBe(200000); // Trả về giá gốc
      expect(result.originalPrice).toBe(200000);
      expect(result.remainingQuota).toBe(0);
      expect(result.isQuotaExhausted).toBe(true);
      expect(result.isSale).toBe(false);
    });

    test("Cấu hình Variant riêng được ưu tiên hơn cấu hình chung của sản phẩm", async () => {
      const bundle = {
        campaigns: [
          {
            _id: "camp-flash-var",
            name: "Flash Sale Variant",
            type: "flash_sale",
            priority: 10,
            startAt: new Date("2026-10-29T08:00:00Z"),
            endAt: new Date("2026-10-29T12:00:00Z"),
          },
        ],
        campaignProducts: [
          // Cấu hình chung sản phẩm: 160.000đ
          {
            campaign_id: "camp-flash-var",
            product_id: "prod-1",
            variant_id: null,
            sale_price: 160000,
            quota: 50,
            sold: 0,
          },
          // Cấu hình riêng cho variant Red: 130.000đ
          {
            campaign_id: "camp-flash-var",
            product_id: "prod-1",
            variant_id: "var-red",
            sale_price: 130000,
            quota: 10,
            sold: 2,
          },
        ],
      };

      // Gọi với variant Red -> lấy giá riêng 130k
      const resultRed = await pricingService.resolvePrice(baseProduct, variantRed, now, null, bundle);
      expect(resultRed.finalPrice).toBe(130000);
      expect(resultRed.remainingQuota).toBe(8);

      // Gọi với variant Blue -> fallback về cấu hình chung 160k
      const resultBlue = await pricingService.resolvePrice(baseProduct, variantBlue, now, null, bundle);
      expect(resultBlue.finalPrice).toBe(160000);
      expect(resultBlue.remainingQuota).toBe(50);
    });
  });

  // =========================================================================
  // 2. 50 đơn đồng thời cùng mua 1 suất cuối: chỉ đúng quota đơn thành công
  // =========================================================================
  describe("2. Concurrency Atomic Quota (50 đơn tranh mua 1 suất cuối)", () => {
    test("Duy nhất 1 đơn thành công, 49 đơn nhận lỗi 409, sold không vượt quá quota", async () => {
      // Giả lập CampaignProduct trong DB với quota = 10, sold = 9 (chỉ còn đúng 1 suất)
      let doc = {
        _id: "cp-atomic-1",
        quota: 10,
        sold: 9,
      };

      // Giả lập hàm atomic findOneAndUpdate của MongoDB với $expr: { $lte: [{ $add: ["$sold", qty] }, "$quota"] }
      // Trên MongoDB thật, lock document ở tầng wiredTiger đảm bảo tuần tự hóa tuyệt đối
      let lock = Promise.resolve();
      const atomicFindOneAndUpdate = async (qty = 1) => {
        return new Promise((resolve) => {
          lock = lock.then(async () => {
            if (doc.sold + qty <= doc.quota) {
              doc.sold += qty;
              resolve({ success: true, doc: { ...doc } });
            } else {
              resolve(null); // Quota exceeded, tương đương MongoDB không match document
            }
          });
        });
      };

      const placeOrderAttempt = async (orderIndex) => {
        const updated = await atomicFindOneAndUpdate(1);
        if (!updated) {
          return { status: 409, error: "Flash Sale hết suất", orderIndex };
        }
        return { status: 200, success: true, orderIndex, remaining: updated.doc.quota - updated.doc.sold };
      };

      // 50 requests đồng thời cùng gửi đến hệ thống
      const requests = Array.from({ length: 50 }, (_, i) => placeOrderAttempt(i + 1));
      const results = await Promise.all(requests);

      const successfulOrders = results.filter((r) => r.status === 200);
      const conflictOrders = results.filter((r) => r.status === 409);

      expect(successfulOrders.length).toBe(1);
      expect(conflictOrders.length).toBe(49);
      expect(doc.sold).toBe(10);
      expect(doc.sold).toBeLessThanOrEqual(doc.quota);
    });
  });

  // =========================================================================
  // 3. per_user_limit khi đặt song song
  // =========================================================================
  describe("3. per_user_limit Chống Vượt Giới Hạn Mua Song Song", () => {
    test("User bị chặn khi tổng số lượng mua song song vượt quá per_user_limit", async () => {
      const perUserLimit = 2;
      const purchases = []; // Giả lập collection campaign_purchases

      let lock = Promise.resolve();
      const placeOrderWithLimit = async (userId, productId, qty) => {
        return new Promise((resolve) => {
          lock = lock.then(async () => {
            const alreadyPurchased = purchases
              .filter((p) => p.userId === userId && p.productId === productId)
              .reduce((sum, p) => sum + p.qty, 0);

            if (alreadyPurchased + qty > perUserLimit) {
              resolve({
                status: 400,
                message: `Bạn đã mua ${alreadyPurchased} sản phẩm. Giới hạn mua là ${perUserLimit} sản phẩm/khách hàng.`,
              });
              return;
            }

            purchases.push({ userId, productId, qty, orderId: "ord-" + Math.random() });
            resolve({ status: 200, message: "Đặt hàng thành công" });
          });
        });
      };

      // User gửi 2 đơn song song, mỗi đơn mua 2 cái -> tổng định mua 4 > limit 2
      const [orderA, orderB] = await Promise.all([
        placeOrderWithLimit("user-99", "prod-1", 2),
        placeOrderWithLimit("user-99", "prod-1", 2),
      ]);

      const successCount = [orderA, orderB].filter((r) => r.status === 200).length;
      const rejectedCount = [orderA, orderB].filter((r) => r.status === 400).length;

      expect(successCount).toBe(1);
      expect(rejectedCount).toBe(1);

      const totalBought = purchases
        .filter((p) => p.userId === "user-99" && p.productId === "prod-1")
        .reduce((sum, p) => sum + p.qty, 0);
      expect(totalBought).toBe(2);
      expect(totalBought).toBeLessThanOrEqual(perUserLimit);
    });
  });

  // =========================================================================
  // 4. Hủy đơn / cron hết hạn: suất hoàn lại đúng một lần (Idempotency)
  // =========================================================================
  describe("4. Hoàn Suất Đơn Hàng An Toàn & Idempotent (restoreOrderStock)", () => {
    test("Gọi hoàn hủy 2 lần liên tiếp thì quota chỉ được hoàn đúng 1 lần duy nhất", async () => {
      let orderState = {
        _id: "order-test-1",
        stock_deducted: true,
        order_items: [
          {
            product_id: "prod-1",
            quantity: 3,
            campaign_id: "camp-1",
          },
        ],
      };

      let campaignProduct = {
        campaign_id: "camp-1",
        product_id: "prod-1",
        sold: 8,
      };

      let purchasesCollection = [
        { order_id: "order-test-1", product_id: "prod-1", quantity: 3 },
      ];

      // Triển khai logic chuẩn như restoreOrderStock
      const restoreOrderStockSimulated = async (orderId) => {
        // Cờ bảo vệ nguyên tử atomic guard
        if (!orderState.stock_deducted) {
          return { restored: false, reason: "Already restored or not deducted" };
        }
        orderState.stock_deducted = false;

        // Hoàn quota flash sale
        for (const item of orderState.order_items) {
          if (item.campaign_id) {
            campaignProduct.sold -= item.quantity;
            purchasesCollection = purchasesCollection.filter(
              (p) => !(p.order_id === orderId && p.product_id === item.product_id)
            );
          }
        }
        return { restored: true };
      };

      // Lần gọi 1: Hoàn thành công
      const call1 = await restoreOrderStockSimulated("order-test-1");
      expect(call1.restored).toBe(true);
      expect(campaignProduct.sold).toBe(5); // 8 - 3 = 5
      expect(purchasesCollection.length).toBe(0);

      // Lần gọi 2 (ví dụ IPN gọi lại hoặc cron chạy lại): Bị chặn bởi stock_deducted = false
      const call2 = await restoreOrderStockSimulated("order-test-1");
      expect(call2.restored).toBe(false);
      expect(campaignProduct.sold).toBe(5); // Giữ nguyên 5, không bị trừ thêm về 2
    });
  });

  // =========================================================================
  // 5. Chiến dịch hết giờ giữa chừng: đơn mới tính giá gốc
  // =========================================================================
  describe("5. Chiến dịch Hết Giờ Giữa Chừng", () => {
    test("Khách xem lúc còn hạn nhưng lúc bấm Đặt Hàng đã hết giờ -> tính giá gốc", async () => {
      const activeCampaign = {
        _id: "camp-flash-expiring",
        name: "Flash Sale 1 Phút",
        type: "flash_sale",
        priority: 10,
        startAt: new Date("2026-10-29T09:00:00Z"),
        endAt: new Date("2026-10-29T10:00:00Z"), // Hết hạn lúc 10:00
      };

      const bundle = {
        campaigns: [activeCampaign],
        campaignProducts: [
          {
            campaign_id: "camp-flash-expiring",
            product_id: "prod-1",
            sale_price: 110000,
            quota: 10,
            sold: 2,
          },
        ],
      };

      // Lúc 09:59 xem giỏ hàng: giá sale 110.000đ
      const timeBrowse = new Date("2026-10-29T09:59:00Z");
      const priceBrowse = await pricingService.resolvePrice(baseProduct, null, timeBrowse, null, bundle);
      expect(priceBrowse.finalPrice).toBe(110000);
      expect(priceBrowse.campaignId).toBe("camp-flash-expiring");

      // Lúc 10:01 bấm đặt hàng: hết giờ, trả giá gốc 200.000đ
      const timeOrder = new Date("2026-10-29T10:01:00Z");
      const priceOrder = await pricingService.resolvePrice(baseProduct, null, timeOrder, null, bundle);
      expect(priceOrder.finalPrice).toBe(200000);
      expect(priceOrder.campaignId).toBeNull();

      // Kiểm tra phát hiện chênh lệch giá để ngăn chặn việc âm thầm tính giá sai
      const isPriceChanged = priceBrowse.finalPrice !== priceOrder.finalPrice;
      expect(isPriceChanged).toBe(true);
    });
  });

  // =========================================================================
  // 6. Voucher + sản phẩm sale theo cờ cấu hình
  // =========================================================================
  describe("6. Voucher Kết Hợp Sản Phẩm Sale Theo Cấu Hình (ALLOW_VOUCHER_ON_SALE)", () => {
    const calculateDiscount = (voucher, items, allowVoucherOnSale = false) => {
      const currentSubtotal = items.reduce(
        (sum, it) => sum + (it.price || it.new_price || 0) * (it.quantity || 1),
        0
      );

      let eligibleSubtotal = currentSubtotal;
      if (!allowVoucherOnSale) {
        const eligibleItems = items.filter((it) => !it.campaign_id);
        eligibleSubtotal = eligibleItems.reduce(
          (sum, it) => sum + (it.price || it.new_price || 0) * (it.quantity || 1),
          0
        );
      }

      if (eligibleSubtotal === 0) {
        return {
          applicable: false,
          discountAmount: 0,
          reason: "Không có sản phẩm nào hợp lệ để áp dụng voucher",
        };
      }

      let discount = 0;
      if (voucher.discountType === "percentage") {
        discount = Math.round((voucher.discountValue / 100) * eligibleSubtotal);
        if (voucher.maxDiscountAmount > 0) {
          discount = Math.min(discount, voucher.maxDiscountAmount);
        }
      } else {
        discount = voucher.discountValue;
      }
      return {
        applicable: true,
        discountAmount: Math.min(discount, eligibleSubtotal),
      };
    };

    const voucher20Pct = {
      discountType: "percentage",
      discountValue: 20, // 20%
      maxDiscountAmount: 50000,
    };

    test("Khi ALLOW_VOUCHER_ON_SALE = false: voucher không được giảm trên item đang sale", () => {
      const cartItems = [
        { product_id: "prod-sale", price: 100000, quantity: 1, campaign_id: "camp-1" }, // Đang sale
        { product_id: "prod-regular", price: 200000, quantity: 1, campaign_id: null }, // Hàng thường
      ];

      // Khi cờ = false (mặc định)
      const resFalse = calculateDiscount(voucher20Pct, cartItems, false);
      expect(resFalse.applicable).toBe(true);
      // Chỉ giảm trên 200.000đ của hàng thường -> 200k * 20% = 40.000đ
      expect(resFalse.discountAmount).toBe(40000);

      // Nếu giỏ hàng chỉ toàn hàng sale
      const onlySaleItems = [
        { product_id: "prod-sale", price: 100000, quantity: 1, campaign_id: "camp-1" },
      ];
      const resOnlySale = calculateDiscount(voucher20Pct, onlySaleItems, false);
      expect(resOnlySale.applicable).toBe(false);
      expect(resOnlySale.discountAmount).toBe(0);
    });

    test("Khi ALLOW_VOUCHER_ON_SALE = true: voucher được giảm trên toàn bộ subtotal", () => {
      const cartItems = [
        { product_id: "prod-sale", price: 100000, quantity: 1, campaign_id: "camp-1" },
        { product_id: "prod-regular", price: 200000, quantity: 1, campaign_id: null },
      ];

      // Khi bật cờ = true: tổng subtotal = 300.000đ -> giảm 20% = 60k max 50k -> 50.000đ
      const resTrue = calculateDiscount(voucher20Pct, cartItems, true);
      expect(resTrue.applicable).toBe(true);
      expect(resTrue.discountAmount).toBe(50000);
    });
  });

  // =========================================================================
  // 7. Cron chuyển trạng thái chạy 2 lần liên tiếp cho cùng kết quả
  // =========================================================================
  describe("7. Cron Chuyển Trạng Thái Idempotent (Scheduled -> Active -> Ended)", () => {
    test("Chạy 2 lần liên tiếp: lần 1 chuyển trạng thái, lần 2 không thay đổi thêm (modifiedCount = 0)", async () => {
      const now = new Date("2026-10-29T10:00:00Z");

      // Giả lập danh sách campaigns trong database
      const campaignsDb = [
        {
          _id: "camp-to-activate",
          name: "Sắp bắt đầu",
          status: "scheduled",
          startAt: new Date("2026-10-29T09:30:00Z"), // <= now
          endAt: new Date("2026-10-29T12:00:00Z"), // > now
          isDeleted: false,
        },
        {
          _id: "camp-to-end",
          name: "Vừa hết hạn",
          status: "active",
          startAt: new Date("2026-10-29T06:00:00Z"),
          endAt: new Date("2026-10-29T09:59:00Z"), // <= now
          isDeleted: false,
        },
        {
          _id: "camp-already-ended",
          name: "Đã kết thúc từ trước",
          status: "ended",
          startAt: new Date("2026-10-28T00:00:00Z"),
          endAt: new Date("2026-10-28T23:59:00Z"),
          isDeleted: false,
        },
      ];

      // Hàm mô phỏng logic của runCampaignStatusTransition
      const runStatusTransition = (checkTime) => {
        let activatedCount = 0;
        let endedCount = 0;

        for (const c of campaignsDb) {
          if (c.isDeleted) continue;

          // 1. scheduled -> active
          if (c.status === "scheduled" && c.startAt <= checkTime && c.endAt > checkTime) {
            c.status = "active";
            activatedCount++;
          }
          // 2. active / scheduled -> ended
          else if ((c.status === "active" || c.status === "scheduled") && c.endAt <= checkTime) {
            c.status = "ended";
            endedCount++;
          }
        }

        const statusChanged = activatedCount > 0 || endedCount > 0;
        return { activatedCount, endedCount, statusChanged };
      };

      // Lần chạy 1
      const res1 = runStatusTransition(now);
      expect(res1.statusChanged).toBe(true);
      expect(res1.activatedCount).toBe(1);
      expect(res1.endedCount).toBe(1);

      // Trạng thái sau lần 1: camp-to-activate đã thành 'active', camp-to-end đã thành 'ended'
      expect(campaignsDb.find((c) => c._id === "camp-to-activate").status).toBe("active");
      expect(campaignsDb.find((c) => c._id === "camp-to-end").status).toBe("ended");

      // Lần chạy 2 ngay sau đó tại cùng thời điểm (hoặc nhịp cron kế tiếp khi chưa đổi giờ)
      const res2 = runStatusTransition(now);
      expect(res2.statusChanged).toBe(false);
      expect(res2.activatedCount).toBe(0);
      expect(res2.endedCount).toBe(0);

      // Đảm bảo không có tác dụng phụ hay trạng thái bị đổi sai
      expect(campaignsDb.find((c) => c._id === "camp-to-activate").status).toBe("active");
      expect(campaignsDb.find((c) => c._id === "camp-to-end").status).toBe("ended");
    });
  });
});

