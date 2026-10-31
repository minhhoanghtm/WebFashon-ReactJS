import orderRepository from "../order.repository.js";
import productRepository from "../../products/product.repository.js";
import productFacade from "../../products/product.facade.js";
import { AppError } from "../../../common/exceptions/AppError.js";
import * as momoProvider from "../../../providers/momo.provider.js";
import mongoose from "mongoose";
import voucherService from "../../vouchers/voucher.service.js";
import { Cart, CartItem } from "../../carts/cart.model.js";
import dotenv from "dotenv";
import pricingService from "../../campaigns/pricing.service.js";
import CampaignProduct from "../../campaigns/campaignProduct.model.js";
import CampaignPurchase from "../../campaigns/campaignPurchase.model.js";
dotenv.config();

export const createOrder = async (userId, orderData) => {
  const session = await mongoose.startSession();
  try {
    let createdOrder;
    let orderItems = [];
    await session.withTransaction(async () => {
      const items = orderData.items || [];
      const paymentMethod =
        orderData.payment_method || orderData.paymentMethod || "cod";
      const rawShippingAddress =
        orderData.shipping_address || orderData.shippingAddress;
      const voucherCode = orderData.voucher_code || orderData.voucherCode;

      let dbShippingAddress = {};
      if (typeof rawShippingAddress === "string") {
        dbShippingAddress = {
          full_name: orderData.fullName || "Khách hàng",
          phone: orderData.phone || "0900000000",
          city: "Chưa xác định",
          district: "Chưa xác định",
          ward: "Chưa xác định",
          address_detail: rawShippingAddress,
        };
      } else if (
        rawShippingAddress &&
        typeof rawShippingAddress === "object"
      ) {
        dbShippingAddress = rawShippingAddress;
      } else {
        throw new AppError("Địa chỉ giao hàng là bắt buộc", 400);
      }

      let subtotal = 0;
      orderItems = [];
      const activeCampaignsBundle = await pricingService.getActiveCampaignsBundle(new Date());





  if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          if (!item.product_id || !mongoose.Types.ObjectId.isValid(item.product_id)) {
            throw new AppError(`product_id không hợp lệ: ${item.product_id}`, 400);
          }
          const productObjectId = new mongoose.Types.ObjectId(item.product_id);

          const product = await productRepository.findOne({
            _id: productObjectId,
          });
          if (!product) {
            throw new AppError(
              `Sản phẩm với id ${item.product_id} không tồn tại`,
              404,
            );
          }

          const variantId = item.variant_id || item.product_variant_id || null;
          const priceInfo = await pricingService.resolvePrice(
            product,
            variantId,
            new Date(),
            userId,
            activeCampaignsBundle
          );

          if (item.price !== undefined && item.price !== null && Math.abs(Number(item.price) - priceInfo.finalPrice) > 0.01) {
            throw new AppError(
              `Giá sản phẩm "${product.name}" đã thay đổi từ ${Number(item.price).toLocaleString("vi-VN")}đ thành ${priceInfo.finalPrice.toLocaleString("vi-VN")}đ do chương trình khuyến mãi thay đổi. Vui lòng cập nhật giỏ hàng.`,
              409
            );
          }

          if (priceInfo.isQuotaExhausted) {
            throw new AppError(
              `Sản phẩm "${product.name}" trong Flash Sale đã hết suất ưu đãi. Vui lòng cập nhật lại giỏ hàng.`,
              409
            );
          }

          if (priceInfo.type === "flash_sale" && priceInfo.cpConfig) {
            const qty = Number(item.quantity);
            if (priceInfo.cpConfig.per_user_limit && userId) {
              const userPurchases = await CampaignPurchase.aggregate([
                {
                  $match: {
                    campaign_id: priceInfo.campaignId,
                    product_id: productObjectId,
                    user_id: new mongoose.Types.ObjectId(userId),
                  },
                },
                {
                  $group: {
                    _id: null,
                    totalBought: { $sum: "$quantity" },
                  },
                },
              ]).session(session);

              const alreadyBought = userPurchases[0]?.totalBought || 0;
              if (alreadyBought + qty > priceInfo.cpConfig.per_user_limit) {
                throw new AppError(
                  `Bạn chỉ được mua tối đa ${priceInfo.cpConfig.per_user_limit} sản phẩm "${product.name}" với giá ưu đãi trong đợt khuyến mãi này.`,
                  400
                );
              }
            }

            const cpDeducted = await CampaignProduct.findOneAndUpdate(
              {
                _id: priceInfo.cpConfig._id,
                $expr: {
                  $lte: [{ $add: ["$sold", qty] }, "$quota"],
                },
              },
              {
                $inc: { sold: qty },
              },
              { session, new: true }
            );

            if (!cpDeducted) {
              throw new AppError(
                `Sản phẩm "${product.name}" trong Flash Sale vừa hết suất khuyến mãi`,
                409
              );
            }
          }

          const priceToUse = priceInfo.finalPrice;
          const totalCalculated = priceToUse * item.quantity;
          subtotal += totalCalculated;

          orderItems.push({
            product_id: productObjectId,
            product_name: product.name,
            product_slug: product.slug,
            product_image:
              product.image ||
              (product.displayProduct && product.displayProduct[0]),
            quantity: item.quantity,
            price: priceToUse,
            variant_id: variantId,
            campaign_id: priceInfo.campaignId || null,
            campaign_name: priceInfo.campaignName || null,
            original_price: priceInfo.originalPrice,
          });
        }
      } else {
        subtotal = Number(orderData.total_price || orderData.totalPrice || 0);
      }

      const shippingFee = (subtotal >= 1000000 || subtotal === 0)
        ? 0
        : (orderData.shippingFee !== undefined ? Number(orderData.shippingFee) : 30000);
      let discountAmount = 0;
      const voucherIds = [];
      const voucherCodes = voucherCode ? voucherCode.split(",").map((c) => c.trim()) : [];

      for (const code of voucherCodes) {
        if (code) {
          const validation = await voucherService.validateVoucher(
            userId,
            code,
            subtotal,
            orderItems,
            shippingFee,
          );
          discountAmount += validation.discountAmount;
          if (validation.voucherId) {
            voucherIds.push(validation.voucherId);
          }

          await voucherService.applyVoucherWithPlaceholder(
            userId,
            code,
            validation.discountAmount,
            { session },
          );
        }
      }

      const finalTotalPrice = Math.max(0, subtotal + shippingFee - discountAmount);

      if (orderItems.length > 0) {
        await productFacade.deductStock(orderItems, session);
      }

      const orderArray = await orderRepository.create(
        [
          {
            user_id: userId,
            total_price: finalTotalPrice,
            original_price: subtotal,
            discount_amount: discountAmount,
            voucher_code: voucherCode ? voucherCode.toUpperCase() : null,
            status: "pending",
            payment_method: paymentMethod.toLowerCase(),
            shipping_address: dbShippingAddress,
            stock_deducted: true,
          },
        ],
        { session },
      );

      createdOrder = orderArray[0];

      // Ghi nhận lượt mua chiến dịch để kiểm soát per_user_limit
      for (const orderItem of orderItems) {
        if (orderItem.campaign_id && userId) {
          await CampaignPurchase.create(
            [
              {
                campaign_id: orderItem.campaign_id,
                product_id: orderItem.product_id,
                user_id: userId,
                order_id: createdOrder._id,
                quantity: orderItem.quantity,
              },
            ],
            { session }
          );
        }
      }

      for (const vId of voucherIds) {
        await voucherService.linkVoucherUsageToOrder(
          userId,
          vId,
          createdOrder._id,
          { session },
        );
      }

      if (orderItems.length > 0) {
        const orderItemsToInsert = orderItems.map((item) => ({
          ...item,
          order_id: createdOrder._id,
        }));

        await orderRepository.insertManyItems(orderItemsToInsert, {
          session,
        });

        const userCart = await Cart.findOne({ user_id: userId }).session(
          session,
        );
        if (userCart) {
          const productIds = orderItems.map((item) => item.product_id);
          await CartItem.deleteMany({
            cart_id: userCart._id,
            product_id: { $in: productIds },
          }).session(session);

          const remainingItems = await CartItem.find({
            cart_id: userCart._id,
          }).session(session);
          const totalItemsCount = remainingItems.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0,
          );
          const totalPrice = remainingItems.reduce(
            (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
            0,
          );
          await Cart.findByIdAndUpdate(
            userCart._id,
            {
              total_items: totalItemsCount,
              total_price: totalPrice,
            },
            { session },
          );
        }
      }
    });

    if (createdOrder) {
      import("../../../sockets/events.js")
        .then(({ emitOrderNotification }) => {
          emitOrderNotification(createdOrder);
        })
        .catch((err) =>
          console.error(
            "Failed to emit order socket notification:",
            err.message,
          ),
        );

      // Ghi nhận sự kiện order_placed sau khi commit transaction (có quy kết A/B Testing)
      if (Array.isArray(orderItems) && orderItems.length > 0) {
        Promise.all([
          import("../../../queues/tracking.queue.js"),
          import("../../recommendations/experiments/experiment.service.js"),
        ])
          .then(([{ addTrackingJob }, { default: expService }]) => {
            expService.resolveOrderAttribution(createdOrder.user_id, orderItems).then((attribution) => {
              orderItems.forEach((item) => {
                addTrackingJob({
                  event_id: new mongoose.Types.ObjectId().toString(),
                  user_id: createdOrder.user_id ? createdOrder.user_id.toString() : null,
                  anonymous_id: null,
                  event_type: "order_placed",
                  product_id: item.product_id ? item.product_id.toString() : null,
                  category_id: null,
                  query: null,
                  meta: {
                    price: item.price || 0,
                    quantity: item.quantity || 1,
                    order_id: createdOrder._id.toString(),
                    payment_method: createdOrder.payment_method,
                    experiment_id: attribution?.experiment_id || null,
                    variant: attribution?.variant || null,
                    rec_attributed: attribution?.is_direct_rec_assisted || false,
                  },
                  timestamp: new Date().toISOString(),
                }).catch(() => {});
              });
            }).catch(() => {});
          })
          .catch((err) => console.warn("[Tracking] Lỗi import trackingQueue/expService:", err.message));
      }
    }

    return createdOrder;
  } catch (error) {
    if (
      error.message &&
      (error.message.includes("does not support document-level writes") ||
        error.message.includes("replica set") ||
        error.message.includes("transaction"))
    ) {
      console.warn(
        "⚠️ MongoDB local does not support Transactions. Falling back to non-transactional execution.",
      );
      return await createOrderWithoutTransaction(userId, orderData);
    }
    throw error;
  } finally {
    session.endSession();
  }
};

export const createOrderWithoutTransaction = async (userId, orderData) => {
  console.log("Inside createOrderWithoutTransaction: userId =", userId, "type =", typeof userId);
  const items = orderData.items || [];
  const paymentMethod =
    orderData.payment_method || orderData.paymentMethod || "cod";
  const rawShippingAddress =
    orderData.shipping_address || orderData.shippingAddress;
  const voucherCode = orderData.voucher_code || orderData.voucherCode;

  let dbShippingAddress = {};
  if (typeof rawShippingAddress === "string") {
    dbShippingAddress = {
      full_name: orderData.fullName || "Khách hàng",
      phone: orderData.phone || "0900000000",
      city: "Chưa xác định",
      district: "Chưa xác định",
      ward: "Chưa xác định",
      address_detail: rawShippingAddress,
    };
  } else if (rawShippingAddress && typeof rawShippingAddress === "object") {
    dbShippingAddress = rawShippingAddress;
  } else {
    throw new AppError("Địa chỉ giao hàng là bắt buộc", 400);
  }

  let subtotal = 0;
  const orderItems = [];

  const activeCampaignsBundle = await pricingService.getActiveCampaignsBundle(new Date());

  if (Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      if (!item.product_id || !mongoose.Types.ObjectId.isValid(item.product_id)) {
        throw new AppError(`product_id không hợp lệ: ${item.product_id}`, 400);
      }
      const productObjectId = new mongoose.Types.ObjectId(item.product_id);

      const product = await productRepository.findOne({
        _id: productObjectId,
      });
      if (!product) {
        throw new AppError(
          `Sản phẩm với id ${item.product_id} không tồn tại`,
          404,
        );
      }

      const variantId = item.variant_id || item.product_variant_id || null;
      const priceInfo = await pricingService.resolvePrice(
        product,
        variantId,
        new Date(),
        userId,
        activeCampaignsBundle
      );

      if (item.price !== undefined && item.price !== null && Math.abs(Number(item.price) - priceInfo.finalPrice) > 0.01) {
        throw new AppError(
          `Giá sản phẩm "${product.name}" đã thay đổi từ ${Number(item.price).toLocaleString("vi-VN")}đ thành ${priceInfo.finalPrice.toLocaleString("vi-VN")}đ do chương trình khuyến mãi thay đổi. Vui lòng cập nhật giỏ hàng.`,
          409
        );
      }

      if (priceInfo.isQuotaExhausted) {
        throw new AppError(
          `Sản phẩm "${product.name}" trong Flash Sale đã hết suất ưu đãi. Vui lòng cập nhật lại giỏ hàng.`,
          409
        );
      }

      if (priceInfo.type === "flash_sale" && priceInfo.cpConfig) {
        const qty = Number(item.quantity);
        if (priceInfo.cpConfig.per_user_limit && userId) {
          const userPurchases = await CampaignPurchase.aggregate([
            {
              $match: {
                campaign_id: priceInfo.campaignId,
                product_id: productObjectId,
                user_id: new mongoose.Types.ObjectId(userId),
              },
            },
            {
              $group: {
                _id: null,
                totalBought: { $sum: "$quantity" },
              },
            },
          ]);

          const alreadyBought = userPurchases[0]?.totalBought || 0;
          if (alreadyBought + qty > priceInfo.cpConfig.per_user_limit) {
            throw new AppError(
              `Bạn chỉ được mua tối đa ${priceInfo.cpConfig.per_user_limit} sản phẩm "${product.name}" với giá ưu đãi trong đợt khuyến mãi này.`,
              400
            );
          }
        }

        const cpDeducted = await CampaignProduct.findOneAndUpdate(
          {
            _id: priceInfo.cpConfig._id,
            $expr: {
              $lte: [{ $add: ["$sold", qty] }, "$quota"],
            },
          },
          {
            $inc: { sold: qty },
          },
          { new: true }
        );

        if (!cpDeducted) {
          throw new AppError(
            `Sản phẩm "${product.name}" trong Flash Sale vừa hết suất khuyến mãi`,
            409
          );
        }
      }

      const priceToUse = priceInfo.finalPrice;
      const totalCalculated = priceToUse * item.quantity;
      subtotal += totalCalculated;

      orderItems.push({
        product_id: productObjectId,
        product_name: product.name,
        product_slug: product.slug,
        product_image:
          product.image ||
          (product.displayProduct && product.displayProduct[0]),
        quantity: item.quantity,
        price: priceToUse,
        variant_id: variantId,
        campaign_id: priceInfo.campaignId || null,
        campaign_name: priceInfo.campaignName || null,
        original_price: priceInfo.originalPrice,
      });
    }
  } else {
    subtotal = Number(orderData.total_price || orderData.totalPrice || 0);
  }

  const shippingFee = (subtotal >= 1000000 || subtotal === 0)
    ? 0
    : (orderData.shippingFee !== undefined ? Number(orderData.shippingFee) : 30000);
  let discountAmount = 0;
  const voucherIds = [];
  const voucherCodes = voucherCode ? voucherCode.split(",").map((c) => c.trim()) : [];

  for (const code of voucherCodes) {
    if (code) {
      const validation = await voucherService.validateVoucher(
        userId,
        code,
        subtotal,
        orderItems,
        shippingFee,
      );
      discountAmount += validation.discountAmount;
      if (validation.voucherId) {
        voucherIds.push({
          id: validation.voucherId,
          disc: validation.discountAmount,
        });
      }

      await voucherService.applyVoucherNoUsage(userId, code);
    }
  }

  const finalTotalPrice = Math.max(0, subtotal + shippingFee - discountAmount);

  if (orderItems.length > 0) {
    await productFacade.deductStock(orderItems);
  }

  const order = await orderRepository.create({
    user_id: userId,
    total_price: finalTotalPrice,
    original_price: subtotal,
    discount_amount: discountAmount,
    voucher_code: voucherCode ? voucherCode.toUpperCase() : null,
    status: "pending",
    payment_method: paymentMethod.toLowerCase(),
    shipping_address: dbShippingAddress,
    stock_deducted: true,
  });

  // Ghi nhận lượt mua chiến dịch để kiểm soát per_user_limit
  for (const orderItem of orderItems) {
    if (orderItem.campaign_id && userId) {
      await CampaignPurchase.create({
        campaign_id: orderItem.campaign_id,
        product_id: orderItem.product_id,
        user_id: userId,
        order_id: order._id,
        quantity: orderItem.quantity,
      });
    }
  }

  for (const vUsage of voucherIds) {
    await voucherService.createVoucherUsage(
      userId,
      vUsage.id,
      order._id,
      vUsage.disc,
    );
  }

  if (orderItems.length > 0) {
    const orderItemsToInsert = orderItems.map((item) => ({
      ...item,
      order_id: order._id,
    }));
    await orderRepository.insertManyItems(orderItemsToInsert);

    const userCart = await Cart.findOne({ user_id: userId });
    if (userCart) {
      const productIds = orderItems.map((item) => item.product_id);
      await CartItem.deleteMany({
        cart_id: userCart._id,
        product_id: { $in: productIds },
      });

      const remainingItems = await CartItem.find({ cart_id: userCart._id });
      const totalItemsCount = remainingItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      );
      const totalPrice = remainingItems.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0,
      );
      await Cart.findByIdAndUpdate(userCart._id, {
        total_items: totalItemsCount,
        total_price: totalPrice,
      });
    }
  }

  import("../../../sockets/events.js")
    .then(({ emitOrderNotification }) => {
      emitOrderNotification(order);
    })
    .catch((err) =>
      console.error("Failed to emit order socket notification:", err.message),
    );

  // Ghi nhận sự kiện order_placed an toàn phía máy chủ (Server-only guard có quy kết A/B Testing)
  if (Array.isArray(orderItems) && orderItems.length > 0) {
    import("../../tracking/tracking.service.js")
      .then(({ default: trackingService }) => {
        trackingService.trackOrderPlaced({
          ...(order.toObject ? order.toObject() : order),
          items: orderItems,
        });
      })
      .catch((err) => console.warn("[Tracking] Lỗi ghi nhận order_placed:", err.message));
  }

  return order;
};

export const paymentOrder = async (userId, orderId, payment_method) => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new AppError("Đơn hàng không tồn tại", 404);
  }
  if (order.user_id.toString() !== userId) {
    throw new AppError("Bạn không có quyền thanh toán đơn hàng này", 403);
  }

  if (order.payment_status === "paid") {
    throw new AppError(
      "Đơn hàng đã được thanh toán hoặc đang trong quá trình xử lý. Vui lòng không thanh toán lại.",
      400,
    );
  }

  if (payment_method === "cod") {
    order.payment_method = "cod";
    order.payment_status = "pending";
    order.status = "confirmed";
    await order.save();
    return {
      success: true,
      message:
        "Đơn hàng đã được đặt thành công. Vui lòng chuẩn bị tiền mặt khi nhận hàng.",
      order,
    };
  }

  if (payment_method === "momo") {
    order.payment_method = "momo";
    order.payment_status = "pending";
    await order.save();

    const momoResult = await momoProvider.createMomoPayment(
      order._id,
      order.total_price,
    );
    return {
      success: true,
      message: "Chuyển đến cổng thanh toán",
      paymentUrl: momoResult.paymentUrl,
      order,
    };
  }

  if (payment_method === "vnpay") {
    order.payment_method = "vnpay";
    order.payment_status = "pending";
    await order.save();

    const paymentUrl = `${process.env.CLIENT_URL}/payment-success?orderId=${order._id}&provider=vnpay`;
    return {
      success: true,
      message: "Chuyển đến cổng thanh toán",
      paymentUrl,
      order,
    };
  }

  throw new AppError("Phương thức thanh toán không hợp lệ", 400);
};
