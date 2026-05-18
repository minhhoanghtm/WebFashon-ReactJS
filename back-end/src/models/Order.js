import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    total_price: {
      type: Number,
      required: true,
      min: 0,
    },

    // 📦 ORDER STATUS
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },

    // 💳 PAYMENT
    payment_method: {
      type: String,
      enum: ["cod", "momo", "vnpay"],
      default: "cod",
      index: true,
    },

    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },

    transaction_id: {
      type: String,
      default: null,
      index: true,
    },

    paid_at: {
      type: Date,
      default: null,
    },

    // 📍 SHIPPING (snapshot từ User)
    shipping_address: {
      full_name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^[0-9]{9,11}$/, "Số điện thoại không hợp lệ"],
      },
      city: {
        type: String,
        required: true,
      },
      district: {
        type: String,
        required: true,
      },
      ward: {
        type: String,
        required: true,
      },
      address_detail: {
        type: String,
        required: true,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 🔥 INDEX
orderSchema.index({ user_id: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ payment_status: 1 });
orderSchema.index({ transaction_id: 1 });

// 🔥 METHODS
orderSchema.methods.isPaid = function () {
  return this.payment_status === "paid";
};

orderSchema.methods.canCancel = function () {
  return ["pending", "confirmed"].includes(this.status);
};

orderSchema.methods.canShip = function () {
  return this.payment_status === "paid" || this.payment_method === "cod";
};

const Order = mongoose.model("Order", orderSchema);

export default Order;