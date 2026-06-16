import orderRepository from "./order.repository.js";
import productRepository from "../products/product.repository.js";
import { AppError } from "../../common/exceptions/AppError.js";
import * as momoProvider from "../../providers/momo.provider.js";
import * as stripeProvider from "../../providers/stripe.provider.js";
import * as zalopayProvider from "../../providers/zalopay.provider.js";
import mongoose from "mongoose";

import voucherService from "../vouchers/voucher.service.js";
import dotenv from "dotenv";
import { Cart, CartItem } from "../carts/cart.model.js";
dotenv.config();

class OrderService {
  async createOrder(userId, orderData) {
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

        let discountAmount = 0;
        let voucherId = null;

        if (voucherCode) {
          // Validate voucher and calculate discount
          const validation = await voucherService.validateVoucher(
            userId,
            voucherCode,
            subtotal,
          );
          discountAmount = validation.discountAmount;
          voucherId = validation.voucherId;

          // Apply voucher inside transaction using placeholder orderId (Original flow sequence step 1)
          await voucherService.applyVoucherWithPlaceholder(
            userId,
            voucherCode,
            discountAmount,
            { session },
          );
        }

        const finalTotalPrice = Math.max(0, subtotal - discountAmount);

        // Create Order inside transaction (Original flow sequence step 2)
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
            },
          ],
          { session },
        );

        createdOrder = orderArray[0];

        // Update the actual order ID in the VoucherUsage record (Original flow sequence step 3)
        if (voucherId) {
          await voucherService.linkVoucherUsageToOrder(
            userId,
            voucherId,
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

          // Remove ordered items from user's cart
          const userCart = await Cart.findOne({ user_id: userId }).session(
            session,
          );
          if (userCart) {
            const productIds = orderItems.map((item) => item.product_id);
            await CartItem.deleteMany({
              cart_id: userCart._id,
              product_id: { $in: productIds },
            }).session(session);

            // Recalculate cart totals
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

      // Trigger realtime socket notifications outside transaction block
      if (createdOrder) {
        import("../../sockets/events.js")
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
      // Fallback for standalone MongoDB databases which do not support transactions
      if (
        error.message &&
        (error.message.includes("does not support document-level writes") ||
          error.message.includes("replica set") ||
          error.message.includes("transaction"))
      ) {
        console.warn(
          "⚠️ MongoDB local does not support Transactions. Falling back to non-transactional execution.",
        );
        return await this.createOrderWithoutTransaction(userId, orderData);
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Non-transactional fallback for development/local systems running standalone MongoDB
  async createOrderWithoutTransaction(userId, orderData) {
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

    let discountAmount = 0;
    let voucherId = null;

    if (voucherCode) {
      const validation = await voucherService.validateVoucher(
        userId,
        voucherCode,
        subtotal,
      );
      discountAmount = validation.discountAmount;
      voucherId = validation.voucherId;

      // Increment Voucher and update UserVoucher (Original fallback flow step 1)
      await voucherService.applyVoucherNoUsage(userId, voucherCode);
    }

    const finalTotalPrice = Math.max(0, subtotal - discountAmount);

    // Create order (Original fallback flow step 2)
    const order = await orderRepository.create({
      user_id: userId,
      total_price: finalTotalPrice,
      original_price: subtotal,
      discount_amount: discountAmount,
      voucher_code: voucherCode ? voucherCode.toUpperCase() : null,
      status: "pending",
      payment_method: paymentMethod.toLowerCase(),
      shipping_address: dbShippingAddress,
    });

    // Create VoucherUsage record (Original fallback flow step 3)
    if (voucherId) {
      await voucherService.createVoucherUsage(
        userId,
        voucherId,
        order._id,
        discountAmount,
      );
    }

    if (orderItems.length > 0) {
      const orderItemsToInsert = orderItems.map((item) => ({
        ...item,
        order_id: order._id,
      }));
      await orderRepository.insertManyItems(orderItemsToInsert);

      // Remove ordered items from user's cart
      const userCart = await Cart.findOne({ user_id: userId });
      if (userCart) {
        const productIds = orderItems.map((item) => item.product_id);
        await CartItem.deleteMany({
          cart_id: userCart._id,
          product_id: { $in: productIds },
        });

        // Recalculate
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

    import("../../sockets/events.js")
      .then(({ emitOrderNotification }) => {
        emitOrderNotification(order);
      })
      .catch((err) =>
        console.error("Failed to emit order socket notification:", err.message),
      );

    return order;
  }

  async getOrdersByUser(userIdString) {
    const userId = new mongoose.Types.ObjectId(userIdString);
    return await orderRepository.aggregate([
      {
        $match: { user_id: userId },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          user_id: 1,
          total_price: 1,
          status: 1,
          payment_method: 1,
          shipping_address: 1,
          phone_number: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $lookup: {
          from: "order_items",
          let: { orderId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$order_id", "$$orderId"],
                },
              },
            },
            {
              $lookup: {
                from: "product_variants",
                localField: "variant_id",
                foreignField: "_id",
                as: "variant",
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "product_id",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $unwind: {
                path: "$variant",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$product",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                product_slug: { $ifNull: ["$product_slug", "$product.slug"] },
              },
            },
            {
              $project: {
                product_id: 1,
                product_name: 1,
                product_image: 1,
                product_slug: 1,
                quantity: 1,
                price: 1,
                "variant.color": 1,
                "variant.size": 1,
                "variant.stock": 1,
                "variant.image_url": 1,
              },
            },
          ],
          as: "items",
        },
      },
    ]);
  }

  async updateOrder(id, orderBody) {
    const updated = await orderRepository.findByIdAndUpdate(id, orderBody);
    if (!updated) {
      throw new AppError("Đơn hàng không tồn tại", 404);
    }

    // Trigger status change notification
    import("../../sockets/events.js")
      .then(({ emitOrderNotification }) => {
        emitOrderNotification(updated);
      })
      .catch((err) =>
        console.error("Failed to emit order socket notification:", err.message),
      );

    return updated;
  }

  async deleteOrder(id) {
    const deleted = await orderRepository.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError("Đơn hàng không tồn tại", 404);
    }
    return deleted;
  }

  async paymentOrder(userId, orderId, payment_method) {
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

    // Call providers
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
      //VNPay simulated payment URL
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
  }

  async paymentCallback(orderId, status, transactionId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Đơn hàng không tồn tại", 404);
    }

    if (status === "success") {
      order.payment_status = "paid";
      order.transaction_id = transactionId;
      order.paid_at = new Date();
      order.status = "confirmed";
    } else {
      order.payment_status = "failed";
    }
    await order.save();

    // Trigger payment callback status notification
    import("../../sockets/events.js")
      .then(({ emitOrderNotification }) => {
        emitOrderNotification(order);
      })
      .catch((err) =>
        console.error("Failed to emit order socket notification:", err.message),
      );

    return order;
  }

  async getKPIs() {
    const revenueStats = await orderRepository.aggregate([
      {
        $match: {
          payment_status: "paid",
          status: "delivered",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total_price" },
        },
      },
    ]);

    const totalRevenue = revenueStats?.[0]?.totalRevenue || 0;

    const totalOrders = await orderRepository.countDocuments({
      payment_status: "paid",
      status: "delivered",
    });

    const totalCustomers = await orderRepository.distinct("user_id");
    const totalCustomersCount = totalCustomers.length;

    const totalSoldProductsData = await orderRepository.aggregateItems([
      {
        $lookup: {
          from: "orders",
          localField: "order_id",
          foreignField: "_id",
          as: "order",
        },
      },
      {
        $unwind: "$order",
      },
      {
        $match: {
          "order.status": "delivered",
          $or: [
            { "order.payment_method": "cod" },
            { "order.payment_status": "paid" },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalSoldProducts: { $sum: "$quantity" },
        },
      },
    ]);
    const totalSoldProducts = totalSoldProductsData[0]?.totalSoldProducts || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalOrders,
      totalCustomers: totalCustomersCount,
      totalSoldProducts,
      avgOrderValue,
    };
  }

  async getRevenueOverview(type) {
    if (!["week", "month", "year"].includes(type)) {
      throw new AppError("type phải là week | month | year", 400);
    }

    const now = new Date();
    const startDate = new Date();

    if (type === "week") {
      startDate.setDate(now.getDate() - 6);
    } else if (type === "month") {
      startDate.setDate(now.getDate() - 29);
    } else if (type === "year") {
      startDate.setMonth(now.getMonth() - 11);
    }

    const revenueData = await orderRepository.aggregate([
      {
        $addFields: {
          createdAtDate: { $toDate: "$createdAt" },
        },
      },
      {
        $match: {
          status: "delivered",
          $or: [{ payment_method: "cod" }, { payment_status: "paid" }],
          createdAtDate: {
            $gte: startDate,
            $lte: now,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: type === "year" ? "%Y-%m" : "%Y-%m-%d",
              date: "$createdAtDate",
            },
          },
          totalRevenue: { $sum: "$total_price" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return revenueData.map((item) => ({
      date: item._id,
      revenue: item.totalRevenue,
    }));
  }

  async getOrderStats(userId) {
    const matchStage = {};
    if (userId) {
      matchStage.user_id = new mongoose.Types.ObjectId(userId);
    }

    const stats = await orderRepository.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
          },
          shippingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "shipping"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          deliveredOrders: 1,
          pendingOrders: 1,
          cancelledOrders: 1,
          confirmedOrders: 1,
          shippingOrders: 1,
        },
      },
    ]);

    return (
      stats[0] || {
        totalOrders: 0,
        deliveredOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        confirmedOrders: 0,
        shippingOrders: 0,
      }
    );
  }

  async getPurchasePerformance() {
    const stats = await orderRepository.aggregate([
      {
        $facet: {
          orderStats: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                placedOrders: {
                  $sum: { $cond: [{ $ne: ["$status", "cancelled"] }, 1, 0] },
                },
                deliveredOrders: {
                  $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
                },
                cancelledOrders: {
                  $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
                },
                totalPaid: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "delivered"] },
                      "$total_price",
                      0,
                    ],
                  },
                },
              },
            },
          ],
          productStats: [
            { $match: { status: "delivered" } },
            {
              $lookup: {
                from: "order_items",
                localField: "_id",
                foreignField: "order_id",
                as: "items",
              },
            },
            { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: null,
                totalProductsPurchased: {
                  $sum: { $ifNull: ["$items.quantity", 0] },
                },
              },
            },
          ],
        },
      },
    ]);

    const data = {
      totalOrders: 0,
      placedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalPaid: 0,
      totalProductsPurchased: 0,
    };

    const orderStats = stats?.[0]?.orderStats?.[0] || {};
    const productStats = stats?.[0]?.productStats?.[0] || {};

    const mergedData = {
      ...data,
      ...orderStats,
      totalProductsPurchased: productStats.totalProductsPurchased || 0,
    };

    const cancelRate =
      mergedData.totalOrders > 0
        ? ((mergedData.cancelledOrders / mergedData.totalOrders) * 100).toFixed(
            2,
          )
        : 0;

    return {
      totalOrders: mergedData.totalOrders,
      placedOrders: mergedData.placedOrders,
      deliveredOrders: mergedData.deliveredOrders,
      cancelledOrders: mergedData.cancelledOrders,
      totalPaid: mergedData.totalPaid,
      totalProductsPurchased: mergedData.totalProductsPurchased || 0,
      cancelRate: `${cancelRate}%`,
    };
  }

  // OrderItem methods
  async createOrderItem(itemData) {
    return await orderRepository.createItem(itemData);
  }

  async getOrderItemsByOrderId(orderId) {
    return await orderRepository.findItemsWithDetails({ order_id: orderId });
  }

  async updateOrderItem(id, itemData) {
    const updated = await orderRepository.findItemByIdAndUpdate(id, itemData, {
      new: true,
    });
    if (!updated) {
      throw new AppError("Không tìm thấy sản phẩm trong đơn hàng", 404);
    }
    return updated;
  }

  async deleteOrderItem(id) {
    const deleted = await orderRepository.findItemByIdAndDelete(id);
    if (!deleted) {
      throw new AppError("Không tìm thấy sản phẩm trong đơn hàng", 404);
    }
    return deleted;
  }

  async getAdminOrders({ page = 1, limit = 10, status, search }) {
    const query = {};
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderCode: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      orderRepository.find(query, { createdAt: -1 }, skip, limit),
      orderRepository.countDocuments(query),
    ]);

    return {
      items: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async updateOrderStatus(id, status) {
    const order = await orderRepository.findById(id);
    if(!order) {
      throw new AppError("Đơn hàng không tồn tại", 404);
    }
    order.status = status === "shipped" ? "shipping" : status;
    await order.save();
    return order;
  }
}

export default new OrderService();
