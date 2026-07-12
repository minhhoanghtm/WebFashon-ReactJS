import orderRepository from "../order.repository.js";
import mongoose from "mongoose";
import { AppError } from "../../../common/exceptions/AppError.js";

export const getOrderDetail = async (orderId) => {
  return await orderRepository.findItemsWithDetails({ order_id: orderId });
};

export const getMyOrders = async (userIdString) => {
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
        payment_status: 1,
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
};

export const getAllOrders = async ({ page = 1, limit = 10, status, search }) => {
  const query = {};
  if (status) {
    query.status = status;
  }

  if (search) {
    const orConditions = [
      { "shipping_address.full_name": { $regex: search, $options: "i" } },
      { "shipping_address.phone": { $regex: search, $options: "i" } },
    ];

    if (mongoose.Types.ObjectId.isValid(search)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(search) });
    } else {
      const escapedSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      orConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: escapedSearch,
            options: "i",
          },
        },
      });
    }
    query.$or = orConditions;
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
};

export const getKPIs = async () => {
  const revenueStats = await orderRepository.aggregate([
    {
      $match: {
        status: "delivered",
        $or: [
          { payment_method: "cod" },
          { payment_status: "paid" }
        ]
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
    status: "delivered",
    $or: [
      { payment_method: "cod" },
      { payment_status: "paid" }
    ]
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
};

export const getRevenueOverview = async (type) => {
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
};

export const getOrderStats = async (userId) => {
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
};

export const getPurchasePerformance = async () => {
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
};
