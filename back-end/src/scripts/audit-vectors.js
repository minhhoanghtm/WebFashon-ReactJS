import "dotenv/config";
import { connectDB } from "../configs/db.js";
import { VectorEmbedding } from "../modules/ai/models/vectorEmbedding.model.js";

async function run() {
  await connectDB();
  const count = await VectorEmbedding.countDocuments();
  const distinctModels = await VectorEmbedding.distinct("embeddingModel");
  const distinctDims = await VectorEmbedding.distinct("dimensions");
  const types = await VectorEmbedding.aggregate([
    {
      $group: {
        _id: "$sourceType",
        count: { $sum: 1 },
        active: { $sum: { $cond: ["$isActive", 1, 0] } },
      },
    },
  ]);
  const sample = await VectorEmbedding.findOne().lean();
  console.log(
    "AUDIT_VECTORS:",
    JSON.stringify(
      {
        count,
        distinctModels,
        distinctDims,
        types,
        sampleKeys: Object.keys(sample || {}),
        sampleModel: sample?.embeddingModel,
        sampleDimensions: sample?.dimensions,
        sampleVectorLength: sample?.embedding?.length,
        sampleHash: sample?.contentHash,
        sampleNorm: sample?.embedding
          ? Math.sqrt(sample.embedding.reduce((s, x) => s + x * x, 0))
          : 0,
      },
      null,
      2
    )
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
