import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    algorithm: {
      type: String,
      trim: true,
      enum: ["control_popular", "treatment_personalized"],
      default: "control_popular",
    },
  },
  { _id: false }
);

const experimentSchema = new mongoose.Schema(
  {
    experiment_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      required: true,
      enum: ["draft", "running", "paused", "completed"],
      default: "running",
      index: true,
    },
    variants: {
      type: [variantSchema],
      default: [
        {
          name: "A",
          weight: 50,
          description: "Control: Thuật toán gợi ý truyền thống (Phổ biến, Bán chạy, Hàng mới)",
          algorithm: "control_popular",
        },
        {
          name: "B",
          weight: 50,
          description: "Treatment: Hybrid AI Cá nhân hóa (Hành vi + Vector Similarity)",
          algorithm: "treatment_personalized",
        },
      ],
    },
    salt: {
      type: String,
      default: "wf_exp_salt_v1",
      trim: true,
    },
    target_metric: {
      type: String,
      default: "purchase_conversion_rate",
      trim: true,
    },
    attribution_window_hours: {
      type: Number,
      default: 24,
      min: 1,
      max: 168, // Tối đa 7 ngày
    },
    traffic_allocation: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    end_date: {
      type: Date,
      default: null,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    config_history: [
      {
        changed_at: { type: Date, default: Date.now },
        changed_by: { type: String, default: "system" },
        changes: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Tự động kiểm tra tổng tỷ trọng variants phải bằng 100 nếu running
experimentSchema.pre("save", function (next) {
  if (this.variants && this.variants.length > 0) {
    const totalWeight = this.variants.reduce((sum, v) => sum + (v.weight || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      const err = new Error(`Tổng tỷ trọng các nhóm thử nghiệm phải bằng 100% (hiện tại: ${totalWeight}%)`);
      if (typeof next === "function") return next(err);
      throw err;
    }
  }
  if (typeof next === "function") {
    next();
  }
});

const Experiment = mongoose.model("experiments", experimentSchema);

export default Experiment;
