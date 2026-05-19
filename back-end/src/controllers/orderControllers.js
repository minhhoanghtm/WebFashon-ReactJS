import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import OrderItem from "../models/OrderItem.js";
import dotnv from "dotenv";
dotnv.config();

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      items = [],
      payment_method,
      shipping_address,
      total_price,
    } = req.body;

    // Validate required fields
    if (!shipping_address) {
      return res.status(400).json({
        success: false,
        message: "Địa chỉ giao hàng là bắt buộc",
      });
    }

    if (!total_price || total_price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Tổng giá tiền không hợp lệ",
      });
    }

    let totalprice = total_price;
    const OrderItems = [];

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const product = await Product.findById(item.product_id).lean();
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Sản phẩm với id ${item.product_id} không tồn tại`,
          });
        }
        const total = product.price * item.quantity;
        totalprice += total;
        OrderItems.push({
          product_id: item.product_id,
          product_name: product.name,
          product_slug: product.slug,
          product_image: product.image,
          quantity: item.quantity,
          price: product.price,
        });
      }
    }

    //Tạo đơn hàng
    const order = await Order.create({
      user_id: userId,
      total_price: totalprice,
      status: "pending",
      payment_method: payment_method || "cod",
      shipping_address,
    });

    if (OrderItems.length > 0) {
      const orderItemsToInsert = OrderItems.map((item) => ({
        ...item,
        order_id: order._id,
      }));

      await OrderItem.insertMany(orderItemsToInsert);
    }

    res.status(200).json({
      success: true,
      message: "Đặt hàng thành công",
      order,
    });
  } catch (error) {
    console.error("Lỗi khi gọi createOrder:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const getOrdersByUser = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const orders = await Order.aggregate([
      // 🔥 1. FILTER theo user (quan trọng nhất)
      {
        $match: { user_id: userId },
      },

      // 🔥 2. SORT newest first
      {
        $sort: { createdAt: -1 },
      },

      // 🔥 3. LIMIT field order (giảm payload)
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

      // 🔥 4. JOIN ORDER ITEMS
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

            // 🔥 JOIN VARIANT
            {
              $lookup: {
                from: "product_variants",
                localField: "variant_id",
                foreignField: "_id",
                as: "variant",
              },
            },

            {
              $unwind: {
                path: "$variant",
                preserveNullAndEmptyArrays: true,
              },
            },

            // 🔥 chỉ lấy field cần thiết
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

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("getOrdersByUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndUpdate(id, req.body);
    res.status(200).json({
      success: true,
      message: "Cập nhật đơn hàng thành công",
    });
  } catch (error) {
    console.error("Lỗi khi gọi updateOrder:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Xóa đơn hàng thành công",
    });
  } catch (error) {
    console.error("Lỗi khi gọi deleteOrder:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

//Thanh toán đơn hàng (cập nhật trạng thái và phương thức thanh toán)
export const paymentOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId, payment_method } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Đơn hàng không tồn tại",
      });
    }
    if (order.user_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thanh toán đơn hàng này",
      });
    }

    //Khong cho thanh toán lại neu da paid
    if (order.payment_status === "paid") {
      return res.status(400).json({
        success: false,
        message:
          "Đơn hàng đã được thanh toán hoặc đang trong quá trình xử lý. Vui lòng không thanh toán lại.",
      });
    }

    //Cod
    if (payment_method === "cod") {
      order.payment_method = "cod";
      order.payment_status = "pending"; //chua tra tien
      order.status = "confirmed"; //dda xac nhan don hang, cho giao hang

      await order.save();
      return res.status(200).json({
        success: true,
        message:
          "Đơn hàng đã được đặt thành công. Vui lòng chuẩn bị tiền mặt khi nhận hàng.",
        order,
      });
    }

    //Online payment (giả lập thành công)
    if (payment_method === "vnpay" || payment_method === "momo") {
      order.payment_method = payment_method;
      order.payment_status = "pending"; //chua tra tien

      await order.save();

      //Giả lập thanh toán thành công sau
      const paymentUrl = `${process.env.CLIENT_URL}/payment-success?orderId=${order._id}`;
      return res.status(200).json({
        success: true,
        message: "Chuyển đến cổng thanh toán",
        paymentUrl,
      });
    }

    res.status(400).json({
      success: false,
      message: "Phương thức thanh toán không hợp lệ",
      order,
    });
  } catch (error) {
    console.error("Lỗi khi gọi paymentOrder:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

//callback giả lập từ cổng thanh toán
export const paymentCallback = async (req, res) => {
  try {
    const { orderId, status, transactionId } = req.query;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Đơn hàng không tồn tại",
      });
    }
    if (status === "success") {
      order.payment_status = "paid";
      order.transaction_id = transactionId;
      order.paid_at = new Date();
      order.status = "confirmed";
      await order.save();
    } else {
      order.payment_status = "failed";
    }
    await order.save();

    return res.redirect(
      `${process.env.CLIENT_URL}/orders?paymentStatus=${order.payment_status}`,
    );
  } catch (error) {
    console.error("Lỗi khi gọi paymentCallback:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

//tống số đơn hàng, doanh thu, khách hàng, sản phẩm đã bán (cho dashboard admin) - có thể thêm sau
export const kpi = async (req, res) => {
  try {
    //Tong quan kinh doanh: doanh thu, đơn hàng, khách hàng, sản phẩm đã bán
    //tong doang thu: chỉ tính đơn đã thanh toán thành công (paid) và giao hàng thành công (delivered)
    const evenue = await Order.aggregate([
      {
        $match: {
          payment_status: "paid", //đã thanh toán
          status: "delivered", //giao thành công
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total_price" },
        },
      },
    ]);
    console.log("Revenue stats:", evenue);
    const totalRevenue = evenue?.[0]?.totalRevenue || 0;
    //Tổng số đơn hàng: đếm tất cả đơn hàng đã tạo (có thể mở rộng sau chỉ đếm đơn đã thanh toán hoặc đã giao)
    const totalOrders = await Order.find({
      payment_status: "paid", //đã thanh toán
      status: "delivered", //giao thành công
    }).countDocuments();

    //Tổng số khách hàng: đếm số lượng user_id duy nhất trong collection orders
    const totalCustomers = await Order.distinct("user_id").countDocuments();

    //Tổng sản phẩm đã bán: tính tổng quantity của tất cả order items thuộc đơn hàng đã thanh toán thành công và giao hàng thành công
    const totalSoldProductsData = await OrderItem.aggregate([
      {
        $lookup: {
          from: "orders", // tên collection MongoDB (chữ thường)
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

    //Giá trị trung bình đơn hàng: tổng doanh thu / tổng số đơn hàng đã thanh toán thành công và giao hàng thành công
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu thống kê thành công",
      data: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalSoldProducts,
        avgOrderValue,
      },
    });
  } catch (error) {
    console.error("Lỗi khi gọi dashboardAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const getRevenueOverview = async (req, res) => {
  try {
    const { type } = req.query;

    if (!["week", "month", "year"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type phải là week | month | year",
      });
    }

    const now = new Date();
    let startDate = new Date();

    //tính toán khoảng thời gian dựa trên type
    if (type === "week") {
      startDate.setDate(now.getDate() - 6);
    } else if (type === "month") {
      startDate.setDate(now.getDate() - 29);
    } else if (type === "year") {
      startDate.setMonth(now.getMonth() - 11);
    }

    //groupId để group theo ngày hoặc tháng tùy type
    let groupId;
    if (type === "year") {
      groupId = {
        $dateToString: { format: "%Y-%m", date: "$createdAt" },
      };
    } else {
      groupId = {
        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
      };
    }

    //Truy vấn doanh thu theo khoảng thời gian và group theo ngày/tháng
    const revenueData = await Order.aggregate([
      {
        $addFields: {
          createdAtDate: { $toDate: "$createdAt" }, // 🔥 FIX
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
              date: "$createdAtDate", // 🔥 dùng field đã convert
            },
          },
          totalRevenue: { $sum: "$total_price" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    //format lại cho FE
    const formattedData = revenueData.map((item) => ({
      date: item._id,
      revenue: item.totalRevenue,
    }));

    return res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Lỗi getRevenueOverview:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const { userId } = req.query; //dung cho user, admin khong can
    const matchStage = {};

    //lọc theo userId nếu có, dùng cho dashboard user, admin sẽ không truyền userId để lấy tổng quan tất cả đơn hàng
    if (userId) {
      matchStage.user_id = new mongoose.Types.ObjectId(userId);
    }

    const stats = await Order.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, 1, 0],
            },
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
            },
          },
          confirmedOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0],
            },
          },
          shippingOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "shipping"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalOrders: 1,
          deliveredOrders: 1,
          pendingOrders: 1,
          cancelledOrders: 1,
          confirmedOrders: 1,
          shippingOrders: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu thống kê thành công",
      data: stats[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        deliveredOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        confirmedOrders: 0,
        shippingOrders: 0,
      },
    });
  } catch (error) {
    console.error("Lỗi khi gọi getOrderStats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};
//tống số đơn hàng, doanh thu, khách hàng, sản phẩm đã mua(cho dashboard user) - có thể thêm sau
export const dashboardUser = async (req, res) => {
  try {
    const stats = await Order.aggregate([]);
    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu thống kê thành công",
      stats,
    });
  } catch (error) {
    console.error("Lỗi khi gọi dashboardUser:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

//Thống kê hiệu suất mua hàng của khách hàng
export const getPurchasePerformance = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,

          // Tổng đơn đã đặt (tất cả đơn)
          totalOrders: {
            $sum: 1,
          },

          // Đơn đã đặt thành công (không bị cancel)
          placedOrders: {
            $sum: {
              $cond: [
                { $in: ["$status", ["pending", "confirmed", "processing"]] },
                1,
                0,
              ],
            },
          },

          // Đơn giao thành công
          deliveredOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, 1, 0],
            },
          },

          // Tổng tiền đã thanh toán (chỉ đơn giao thành công)
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, "$total_price", 0],
            },
          },
        },
      },
    ]);

    const data = stats?.[0] || {
      totalOrders: 0,
      placedOrders: 0,
      deliveredOrders: 0,
      totalPaid: 0,
    };

    return res.json({
      success: true,
      data: {
        totalOrders: data.totalOrders,
        placedOrders: data.placedOrders,
        deliveredOrders: data.deliveredOrders,
        totalPaid: data.totalPaid,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi thống kê đơn hàng",
    });
  }
};
