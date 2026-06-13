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
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
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
    voucher_code: {
      type: String,
      default: null,
    },
    discount_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    original_price: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

orderSchema.index({ user_id: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ payment_status: 1 });
orderSchema.index({ transaction_id: 1 });

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

const orderItemSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    product_name: String,
    product_image: String,
    product_slug: String,
  },
  { timestamps: true }
);

orderItemSchema.index({ order_id: 1 });
orderItemSchema.index({ order_id: 1, product_id: 1 });

const OrderItem = mongoose.model("order_items", orderItemSchema);

export { Order, OrderItem };
export default Order;
