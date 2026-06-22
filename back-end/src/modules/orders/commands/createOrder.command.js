import orderRepository from "../order.repository.js";
import productRepository from "../../products/product.repository.js";
import productFacade from "../../products/product.facade.js";
import { AppError } from "../../../common/exceptions/AppError.js";
import * as momoProvider from "../../../providers/momo.provider.js";
import mongoose from "mongoose";
import voucherService from "../../vouchers/voucher.service.js";
import { Cart, CartItem } from "../../carts/cart.model.js";
import dotenv from "dotenv";
dotenv.config();

export const createOrder = async (userId, orderData) => {
  const session = await mongoose.startSession();
  try {
    let createdOrder;
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
      const orderItems = [];

      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const product = await productRepository.findOne({
            _id: item.product_id,
          });
          if (!product) {
            throw new AppError(
              `Sản phẩm với id ${item.product_id} không tồn tại`,
              404,
            );
          }

          const priceToUse = product.new_price || product.price || 0;
          const totalCalculated = priceToUse * item.quantity;
          subtotal += totalCalculated;

          orderItems.push({
            product_id: item.product_id,
            product_name: product.name,
            product_slug: product.slug,
            product_image:
              product.image ||
              (product.displayProduct && product.displayProduct[0]),
            quantity: item.quantity,
            price: priceToUse,
            variant_id: item.variant_id || item.product_variant_id || null,
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

  if (Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      const product = await productRepository.findOne({
        _id: item.product_id,
      });
      if (!product) {
        throw new AppError(
          `Sản phẩm với id ${item.product_id} không tồn tại`,
          404,
        );
      }

      const priceToUse = product.new_price || product.price || 0;
      const totalCalculated = priceToUse * item.quantity;
      subtotal += totalCalculated;

      orderItems.push({
        product_id: item.product_id,
        product_name: product.name,
        product_slug: product.slug,
        product_image:
          product.image ||
          (product.displayProduct && product.displayProduct[0]),
        quantity: item.quantity,
        price: priceToUse,
        variant_id: item.variant_id || item.product_variant_id || null,
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
