import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const runMigration = async () => {
  try {
    const dbUrl = process.env.MONGO_CONNECTIONSTRING;
    if (!dbUrl) {
      throw new Error("MONGO_CONNECTIONSTRING is not defined in .env file");
    }

    console.log("Connecting to database...");
    await mongoose.connect(dbUrl);
    console.log("✓ Connected to MongoDB");

    const db = mongoose.connection.db;
    const pagesCollection = db.collection("pages");
    const sectionsCollection = db.collection("page_sections");

    const pages = await pagesCollection.find({}).toArray();
    console.log(`Found ${pages.length} total pages in DB.`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const page of pages) {
      const pageId = page._id;

      // Idempotency check: see if sections already exist for this page
      const existingSections = await sectionsCollection.countDocuments({ pageId });
      if (existingSections > 0) {
        console.log(`[SKIPPED] Page "${page.title}" (${pageId}) already has sections.`);
        skippedCount++;
        continue;
      }

      // Check if page has legacy fields
      const content = page.content || "";
      const bannerUrl = page.bannerUrl || "";
      const thumbnailUrl = page.thumbnailUrl || "";
      const relatedProducts = page.relatedProducts || [];

      const sectionsToInsert = [];
      let orderIdx = 0;

      // 1. Create hero section if banner/thumbnail exists
      if (bannerUrl || thumbnailUrl) {
        sectionsToInsert.push({
          pageId,
          type: "hero",
          order: orderIdx++,
          isActive: true,
          data: {
            title: page.title || "",
            subtitle: page.excerpt || "",
            description: "",
            coverImage: bannerUrl || thumbnailUrl || "",
            buttonText: "",
            buttonLink: ""
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // 2. Create story section if content exists
      if (content) {
        sectionsToInsert.push({
          pageId,
          type: "story",
          order: orderIdx++,
          isActive: true,
          data: {
            heading: page.title || "",
            content: content
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // 3. Create products section if relatedProducts exists
      if (relatedProducts && relatedProducts.length > 0) {
        sectionsToInsert.push({
          pageId,
          type: "products",
          order: orderIdx++,
          isActive: true,
          data: {
            productIds: relatedProducts
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      if (sectionsToInsert.length > 0) {
        await sectionsCollection.insertMany(sectionsToInsert);
        console.log(`[MIGRATED] Page "${page.title}" (${pageId}) -> Created ${sectionsToInsert.length} sections.`);
        migratedCount++;
      } else {
        console.log(`[NO DATA] Page "${page.title}" (${pageId}) has no content/images to migrate.`);
        skippedCount++;
      }
    }

    console.log("\nMigration completed successfully.");
    console.log(`Migrated: ${migratedCount} pages.`);
    console.log(`Skipped/No Data: ${skippedCount} pages.`);

    await mongoose.connection.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
