import mongoose from "mongoose";

const vectorEmbeddingSchema = new mongoose.Schema(
  {
    sourceId: {
      type: String,
      required: true,
      index: true,
    },
    sourceType: {
      type: String,
      required: true,
      enum: ["product", "page", "voucher", "category", "faq", "policy", "settings"],
      index: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    contentNoAccents: {
      type: String,
      default: "",
    },
    embedding: {
      type: [Number],
      required: true,
    },
    embeddingModel: {
      type: String,
      required: true,
      default: "openai/text-embedding-3-small",
    },
    dimensions: {
      type: Number,
      required: true,
      default: 1536,
    },
    contentHash: {
      type: String,
      required: true,
      index: true,
    },
    permissionScope: {
      type: String,
      default: "public",
      index: true,
    },
    tenantId: {
      type: String,
      default: "default",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique composite index to prevent duplicate embeddings per source entity
vectorEmbeddingSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });

// Compound indexes for metadata pre-filtering
vectorEmbeddingSchema.index({ sourceType: 1, isActive: 1, permissionScope: 1 });
vectorEmbeddingSchema.index({ "metadata.categoryId": 1, isActive: 1 });
vectorEmbeddingSchema.index({ "metadata.price": 1, "metadata.inStock": 1 });

/**
 * Helper returning the MongoDB Atlas Vector Search index definition
 * so it matches the configured embedding dimensions.
 */
export const getAtlasVectorIndexDefinition = (dimensions = 1536) => ({
  name: process.env.VECTOR_INDEX_NAME || "vector_index",
  type: "vectorSearch",
  definition: {
    fields: [
      {
        type: "vector",
        path: "embedding",
        numDimensions: Number(dimensions) || 1536,
        similarity: "cosine",
      },
      {
        type: "filter",
        path: "sourceType",
      },
      {
        type: "filter",
        path: "isActive",
      },
      {
        type: "filter",
        path: "permissionScope",
      },
      {
        type: "filter",
        path: "tenantId",
      },
      {
        type: "filter",
        path: "metadata.inStock",
      },
      {
        type: "filter",
        path: "metadata.price",
      },
      {
        type: "filter",
        path: "metadata.categoryId",
      },
    ],
  },
});

const VectorEmbedding = mongoose.model(
  "VectorEmbedding",
  vectorEmbeddingSchema,
  "vector_embeddings"
);

export { VectorEmbedding };
export default VectorEmbedding;
