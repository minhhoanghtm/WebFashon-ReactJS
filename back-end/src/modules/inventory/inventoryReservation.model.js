import mongoose from "mongoose";

const reservationItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product_variants",
      default: null,
    },
    sku: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "",
    },
    size: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const inventoryReservationSchema = new mongoose.Schema(
  {
    reservationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    checkoutSessionId: {
      type: String,
      default: null,
      index: true,
    },
    items: {
      type: [reservationItemSchema],
      required: true,
      validate: [(v) => Array.isArray(v) && v.length > 0, "Cần ít nhất một sản phẩm để giữ hàng"],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "RELEASED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },
    idempotencyKey: {
      type: String,
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

inventoryReservationSchema.index({ userId: 1, status: 1, expiresAt: 1 });
inventoryReservationSchema.index({ "items.sku": 1, status: 1 });

const InventoryReservation =
  mongoose.models.InventoryReservation ||
  mongoose.model("InventoryReservation", inventoryReservationSchema);

export default InventoryReservation;

