import VectorEmbedding, { getAtlasVectorIndexDefinition } from "../models/vectorEmbedding.model.js";
import embeddingService from "./embedding.service.js";
import Product, { ProductVariant } from "../../products/product.model.js";
import Category from "../../categories/category.model.js";
import Page from "../../pages/page.model.js";
import PageSection from "../../pageSections/pageSection.model.js";
import Voucher from "../../vouchers/voucher.model.js";
import WebsiteSettings from "../../websiteSettings/websiteSettings.model.js";
import pricingService from "../../campaigns/pricing.service.js";
import { toNoAccent } from "../../../common/utils/removeAccents.js";
import logger from "../../../common/logger.js";

function stripHtml(html = "") {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class VectorIndexService {
  constructor() {
    this.syncState = {
      isRunning: false,
      lastRunAt: null,
      lastCompletedAt: null,
      status: "idle", // idle | running | completed | failed
      progress: {
        processed: 0,
        total: 0,
        embedded: 0,
        reused: 0,
        updatedMetadataOnly: 0,
        failed: 0,
        deactivated: 0,
      },
      lastSummary: null,
      lastError: null,
    };
  }

  /**
   * Build structured document representation for a Product
   */
  buildProductDocument(product, variants = [], categoryName = "Thời trang", resolvedPrice = null) {
    const prodId = String(product._id);
    const activeVariants = Array.isArray(variants) ? variants : [];
    const inStockVariants = activeVariants.filter((v) => Number(v.stock || 0) > 0);

    const totalStock =
      activeVariants.length > 0
        ? activeVariants.reduce((sum, v) => sum + Number(v.stock || 0), 0)
        : Number(product.stock || 0);

    const colors = [
      ...new Set(
        (inStockVariants.length > 0 ? inStockVariants : activeVariants)
          .map((v) => v.color)
          .filter(Boolean)
      ),
    ];
    const sizes = [
      ...new Set(
        (inStockVariants.length > 0 ? inStockVariants : activeVariants)
          .map((v) => v.size)
          .filter(Boolean)
      ),
    ];

    const finalPrice = Number(resolvedPrice?.finalPrice ?? product.new_price ?? product.price ?? 0);
    const oldPrice = Number(
      resolvedPrice?.isSale
        ? resolvedPrice.originalPrice
        : product.old_price ?? product.oldPrice ?? finalPrice
    );

    const cleanDesc = stripHtml(product.description || "");
    const contentParts = [
      `Sản phẩm: ${product.name}`,
      `Danh mục: ${categoryName || "Thời trang"}`,
      `Giá bán: ${finalPrice.toLocaleString("vi-VN")}đ${
        oldPrice > finalPrice ? ` (Giá gốc: ${oldPrice.toLocaleString("vi-VN")}đ)` : ""
      }`,
      colors.length > 0 ? `Màu sắc: ${colors.join(", ")}` : "",
      sizes.length > 0 ? `Kích thước (Size): ${sizes.join(", ")}` : "",
      `Tình trạng: ${totalStock > 0 ? `Còn hàng (${totalStock} sản phẩm)` : "Hết hàng"}`,
      cleanDesc ? `Mô tả chi tiết: ${cleanDesc}` : "",
    ].filter(Boolean);

    const content = contentParts.join(". ");
    const image =
      (Array.isArray(product.displayProduct) && product.displayProduct[0]) ||
      activeVariants.find((v) => v.image_url)?.image_url ||
      product.image ||
      "";

    const isActive = product.is_active !== false;

    return {
      sourceId: prodId,
      sourceType: "product",
      title: product.name,
      content,
      contentNoAccents: toNoAccent(content).toLowerCase(),
      isActive,
      permissionScope: isActive ? "public" : "admin",
      tenantId: "default",
      metadata: {
        productId: prodId,
        name: product.name,
        slug: product.slug || prodId,
        categoryId: String(product.category_id?._id || product.category_id || ""),
        categoryName: categoryName || "Thời trang",
        price: finalPrice,
        oldPrice,
        stock: totalStock,
        inStock: totalStock > 0,
        colors,
        sizes,
        rating: Number(product.rating || 0),
        sold: Number(product.sold || 0),
        isFeatured: Boolean(product.is_featured),
        image,
        variants: activeVariants.map((v) => ({
          variantId: String(v._id || ""),
          color: v.color,
          size: v.size,
          stock: Number(v.stock || 0),
        })),
      },
    };
  }

  /**
   * Build structured document representation for a CMS Page & its PageSections
   */
  buildPageDocument(page, sections = []) {
    const pageId = String(page._id);
    const activeSections = (Array.isArray(sections) ? sections : []).filter(
      (s) => s.isActive !== false
    );

    const sectionTexts = activeSections
      .map((sec) => {
        const d = sec.data || {};
        return [
          d.title,
          d.subtitle,
          d.heading,
          stripHtml(d.content || d.text || d.description || d.body || ""),
          d.quote,
          d.author,
          Array.isArray(d.items)
            ? d.items
                .map((it) =>
                  [it.title, it.question, stripHtml(it.content || it.answer || it.description || "")]
                    .filter(Boolean)
                    .join(": ")
                )
                .join("; ")
            : "",
        ]
          .filter(Boolean)
          .join(". ");
      })
      .filter(Boolean);

    const typeLabels = {
      about: "Giới thiệu thương hiệu",
      policy: "Chính sách cửa hàng",
      faq: "Câu hỏi thường gặp (FAQ)",
      guide: "Hướng dẫn mua hàng & chọn size",
      lookbook: "Bộ sưu tập Lookbook",
      landing: "Trang thông tin",
      blog: "Bài viết thời trang",
    };

    const contentParts = [
      `${typeLabels[page.type] || "Trang thông tin"}: ${page.title}`,
      page.excerpt ? `Tóm tắt: ${stripHtml(page.excerpt)}` : "",
      page.seoDescription ? `Mô tả: ${stripHtml(page.seoDescription)}` : "",
      sectionTexts.length > 0 ? `Nội dung: ${sectionTexts.join(" | ")}` : "",
    ].filter(Boolean);

    const content = contentParts.join(". ");
    const isPublished = page.status === "published";

    return {
      sourceId: pageId,
      sourceType: "page",
      title: page.title,
      content,
      contentNoAccents: toNoAccent(content).toLowerCase(),
      isActive: isPublished,
      permissionScope: isPublished ? "public" : "admin",
      tenantId: "default",
      metadata: {
        pageId,
        title: page.title,
        slug: page.slug,
        pageType: page.type,
        status: page.status,
        url: `/${page.type === "lookbook" ? `lookbooks/${page.slug}` : page.slug}`,
      },
    };
  }

  /**
   * Build structured document representation for a Voucher
   */
  buildVoucherDocument(voucher) {
    const voucherId = String(voucher._id);
    const now = new Date();
    const isActive =
      voucher.status === "ACTIVE" &&
      !voucher.isDeleted &&
      (!voucher.startDate || new Date(voucher.startDate) <= now) &&
      (!voucher.endDate || new Date(voucher.endDate) >= now);

    const discountText =
      voucher.discountType === "percentage"
        ? `Giảm ${voucher.discountValue}%${
            voucher.maxDiscountAmount
              ? ` (tối đa ${Number(voucher.maxDiscountAmount).toLocaleString("vi-VN")}đ)`
              : ""
          }`
        : `Giảm ${Number(voucher.discountValue || 0).toLocaleString("vi-VN")}đ`;

    const minOrderText = voucher.minOrderValue
      ? `Đơn hàng tối thiểu ${Number(voucher.minOrderValue).toLocaleString("vi-VN")}đ`
      : "Không yêu cầu giá trị đơn tối thiểu";

    const content = [
      `Mã giảm giá (Voucher): ${voucher.code}`,
      `Ưu đãi: ${discountText}`,
      `Điều kiện: ${minOrderText}`,
      voucher.description ? `Mô tả: ${voucher.description}` : "",
      voucher.endDate
        ? `Hạn sử dụng đến: ${new Date(voucher.endDate).toLocaleDateString("vi-VN")}`
        : "",
    ]
      .filter(Boolean)
      .join(". ");

    return {
      sourceId: voucherId,
      sourceType: "voucher",
      title: `Voucher ${voucher.code}`,
      content,
      contentNoAccents: toNoAccent(content).toLowerCase(),
      isActive,
      permissionScope: isActive ? "public" : "admin",
      tenantId: "default",
      metadata: {
        voucherId,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: Number(voucher.discountValue || 0),
        minOrderValue: Number(voucher.minOrderValue || 0),
        endDate: voucher.endDate,
        status: voucher.status,
      },
    };
  }

  /**
   * Build structured document representation for WebsiteSettings (Store Info)
   */
  buildWebsiteSettingsDocument(settings) {
    const gen = settings?.general || {};
    const footer = settings?.footer || {};
    const social = settings?.socialLinks || {};

    const content = [
      `Thông tin cửa hàng ${gen.siteName || "404Studio"}: ${gen.siteDescription || "Thương hiệu thời trang cao cấp"}`,
      gen.address ? `Địa chỉ trụ sở / cửa hàng: ${gen.address}` : "",
      gen.hotline ? `Số điện thoại Hotline hỗ trợ: ${gen.hotline}` : "",
      gen.email ? `Email liên hệ: ${gen.email}` : "",
      gen.workingHours ? `Giờ mở cửa / làm việc: ${gen.workingHours}` : "",
      footer.companyName ? `Đơn vị chủ quản: ${footer.companyName}` : "",
    ]
      .filter(Boolean)
      .join(". ");

    return {
      sourceId: String(settings?._id || "default"),
      sourceType: "settings",
      title: `Thông tin liên hệ & cửa hàng ${gen.siteName || "404Studio"}`,
      content,
      contentNoAccents: toNoAccent(content).toLowerCase(),
      isActive: true,
      permissionScope: "public",
      tenantId: "default",
      metadata: {
        siteName: gen.siteName || "404Studio",
        hotline: gen.hotline || "",
        email: gen.email || "",
        address: gen.address || "",
        workingHours: gen.workingHours || "",
        socialLinks: social,
      },
    };
  }

  /**
   * Upsert a single document into Vector Storage, avoiding re-embedding if contentHash is unchanged
   */
  async upsertDocument(doc, options = {}) {
    const activeProvider = embeddingService.provider;
    const targetModel = activeProvider.model || "openai/text-embedding-3-small";
    const contentHash = embeddingService.computeContentHash(doc.content, targetModel);

    const existing = await VectorEmbedding.findOne({
      sourceType: doc.sourceType,
      sourceId: doc.sourceId,
    }).lean();

    const normExistingModel = String(existing?.embeddingModel || "").replace(
      /^(openai|openrouter|google|gemini)\//i,
      ""
    );
    const normTargetModel = String(targetModel).replace(
      /^(openai|openrouter|google|gemini)\//i,
      ""
    );

    if (
      existing &&
      existing.contentHash === contentHash &&
      normExistingModel === normTargetModel &&
      Array.isArray(existing.embedding) &&
      existing.embedding.length > 0 &&
      !options.force
    ) {
      // Only update metadata & active status without calling Embedding API
      await VectorEmbedding.updateOne(
        { _id: existing._id },
        {
          $set: {
            title: doc.title,
            isActive: doc.isActive,
            permissionScope: doc.permissionScope,
            metadata: doc.metadata,
            lastSyncedAt: new Date(),
          },
        }
      );
      return { status: "reused", sourceId: doc.sourceId, sourceType: doc.sourceType };
    }

    const embedRes = await embeddingService.embedText(doc.content, {
      ...options,
      allowLocalFallback: options.allowLocalFallback ?? false,
    });

    if (embedRes.fallback) {
      throw new Error("Cannot save fallback hash vector into production vector storage to prevent vector space contamination");
    }

    await VectorEmbedding.findOneAndUpdate(
      { sourceType: doc.sourceType, sourceId: doc.sourceId },
      {
        $set: {
          title: doc.title,
          content: doc.content,
          contentNoAccents: doc.contentNoAccents || toNoAccent(doc.content).toLowerCase(),
          embedding: embedRes.vector,
          embeddingModel: embedRes.model,
          dimensions: embedRes.dimensions,
          contentHash: embedRes.contentHash,
          permissionScope: doc.permissionScope || "public",
          tenantId: doc.tenantId || "default",
          isActive: doc.isActive !== false,
          metadata: doc.metadata || {},
          lastSyncedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return {
      status: "embedded",
      sourceId: doc.sourceId,
      sourceType: doc.sourceType,
      dimensions: embedRes.dimensions,
      model: embedRes.model,
    };
  }

  /**
   * Batch upsert multiple structured documents into Vector Storage
   */
  async upsertBatchDocuments(docs, options = {}) {
    if (!Array.isArray(docs) || docs.length === 0) {
      return { total: 0, embedded: 0, reused: 0, failed: 0, errors: [] };
    }

    // Load existing hashes & vectors from DB in 1 query
    const pairs = docs.map((d) => ({ sourceType: d.sourceType, sourceId: d.sourceId }));
    const existingRecords = await VectorEmbedding.find({ $or: pairs })
      .select("sourceType sourceId contentHash embedding embeddingModel dimensions")
      .lean();

    const existingMap = new Map(
      existingRecords.map((r) => [`${r.sourceType}:${r.sourceId}`, r])
    );

    const batchItems = docs.map((d) => {
      const ex = existingMap.get(`${d.sourceType}:${d.sourceId}`);
      return {
        id: `${d.sourceType}:${d.sourceId}`,
        text: d.content,
        existingHash: ex?.contentHash,
        existingVector: ex?.embedding,
        existingModel: ex?.embeddingModel,
      };
    });

    const batchEmbedResult = await embeddingService.embedBatch(batchItems, {
      ...options,
      allowLocalFallback: options.allowLocalFallback ?? false,
    });

    const bulkOps = [];
    const errors = [];
    let embedded = 0;
    let reused = 0;
    let failed = 0;

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const itemRes = batchEmbedResult.results[i];

      if (!itemRes || itemRes.status === "failed" || !Array.isArray(itemRes.vector) || itemRes.fallback) {
        failed++;
        errors.push({
          sourceType: doc.sourceType,
          sourceId: doc.sourceId,
          error: itemRes?.fallback ? "Fallback hash vector rejected to prevent vector space contamination" : (itemRes?.error || "Embedding failed"),
        });
        continue;
      }

      if (itemRes.status === "reused") {
        reused++;
      } else {
        embedded++;
      }

      bulkOps.push({
        updateOne: {
          filter: { sourceType: doc.sourceType, sourceId: doc.sourceId },
          update: {
            $set: {
              title: doc.title,
              content: doc.content,
              contentNoAccents: doc.contentNoAccents || toNoAccent(doc.content).toLowerCase(),
              embedding: itemRes.vector,
              embeddingModel: itemRes.model,
              dimensions: itemRes.dimensions,
              contentHash: itemRes.contentHash,
              permissionScope: doc.permissionScope || "public",
              tenantId: doc.tenantId || "default",
              isActive: doc.isActive !== false,
              metadata: doc.metadata || {},
              lastSyncedAt: new Date(),
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      await VectorEmbedding.bulkWrite(bulkOps, { ordered: false });
    }

    return {
      total: docs.length,
      embedded,
      reused,
      failed,
      totalTokens: batchEmbedResult.summary.totalTokens,
      totalCostUsd: batchEmbedResult.summary.totalCostUsd,
      latencyMs: batchEmbedResult.summary.latencyMs,
      errors,
    };
  }

  /**
   * Sync a single product by ID (used when creating or updating a product/variant)
   */
  async syncProductById(productId, options = {}) {
    if (!productId) return null;
    const product = await Product.findById(productId).lean();
    if (!product) {
      await this.removeVector("product", String(productId));
      return { status: "removed", sourceId: String(productId) };
    }

    const [variants, category, resolvedPrice] = await Promise.all([
      ProductVariant.find({ product_id: product._id }).lean(),
      product.category_id ? Category.findById(product.category_id).select("name").lean() : null,
      pricingService.resolvePrice(product).catch(() => null),
    ]);

    const doc = this.buildProductDocument(
      product,
      variants,
      category?.name || "Thời trang",
      resolvedPrice
    );

    return await this.upsertDocument(doc, options);
  }

  /**
   * Sync a single CMS Page by ID
   */
  async syncPageById(pageId, options = {}) {
    if (!pageId) return null;
    const page = await Page.findById(pageId).lean();
    if (!page) {
      await this.removeVector("page", String(pageId));
      return { status: "removed", sourceId: String(pageId) };
    }

    const sections = await PageSection.find({ pageId: page._id, isActive: true })
      .sort({ order: 1 })
      .lean();
    const doc = this.buildPageDocument(page, sections);
    return await this.upsertDocument(doc, options);
  }

  /**
   * Remove vector when original entity is deleted
   */
  async removeVector(sourceType, sourceId) {
    const res = await VectorEmbedding.deleteOne({
      sourceType,
      sourceId: String(sourceId),
    });
    return { deletedCount: res.deletedCount || 0 };
  }

  /**
   * Full or selective synchronization of business database into Vector Storage
   */
  async syncAll({
    types = ["product", "page", "voucher", "settings"],
    force = false,
    batchSize = 25,
    allowLocalFallback = false,
  } = {}) {
    if (this.syncState.isRunning) {
      return {
        alreadyRunning: true,
        syncState: this.syncState,
      };
    }

    this.syncState.isRunning = true;
    this.syncState.status = "running";
    this.syncState.lastRunAt = new Date();
    this.syncState.lastError = null;
    this.syncState.progress = {
      processed: 0,
      total: 0,
      embedded: 0,
      reused: 0,
      failed: 0,
      removedOrphaned: 0,
    };

    const startTime = Date.now();

    try {
      const docsToSync = [];
      const activeIdsByType = new Map();

      // 1. Collect Products
      if (types.includes("product")) {
        const [products, allVariants, categories, activeBundle] = await Promise.all([
          Product.find({}).lean(),
          ProductVariant.find({}).lean(),
          Category.find({}).select("_id name").lean(),
          pricingService.getActiveCampaignsBundle(new Date()).catch(() => null),
        ]);

        const categoryMap = new Map(categories.map((c) => [String(c._id), c.name]));
        const variantsByProduct = new Map();
        for (const v of allVariants) {
          const pid = String(v.product_id);
          if (!variantsByProduct.has(pid)) variantsByProduct.set(pid, []);
          variantsByProduct.get(pid).push(v);
        }

        const productSourceIds = new Set();
        for (const product of products) {
          const pid = String(product._id);
          productSourceIds.add(pid);
          const resolvedPrice = await pricingService
            .resolvePrice(product, null, new Date(), null, activeBundle)
            .catch(() => null);
          const catName = categoryMap.get(String(product.category_id)) || "Thời trang";
          docsToSync.push(
            this.buildProductDocument(
              product,
              variantsByProduct.get(pid) || [],
              catName,
              resolvedPrice
            )
          );
        }
        activeIdsByType.set("product", productSourceIds);
      }

      // 2. Collect Pages & PageSections
      if (types.includes("page")) {
        const [pages, sections] = await Promise.all([
          Page.find({}).lean(),
          PageSection.find({ isActive: true }).sort({ order: 1 }).lean(),
        ]);

        const sectionsByPage = new Map();
        for (const s of sections) {
          const pid = String(s.pageId);
          if (!sectionsByPage.has(pid)) sectionsByPage.set(pid, []);
          sectionsByPage.get(pid).push(s);
        }

        const pageSourceIds = new Set();
        for (const page of pages) {
          const pid = String(page._id);
          pageSourceIds.add(pid);
          docsToSync.push(this.buildPageDocument(page, sectionsByPage.get(pid) || []));
        }
        activeIdsByType.set("page", pageSourceIds);
      }

      // 3. Collect Vouchers
      if (types.includes("voucher")) {
        const vouchers = await Voucher.find({ isDeleted: { $ne: true } }).lean();
        const voucherSourceIds = new Set();
        for (const v of vouchers) {
          const vid = String(v._id);
          voucherSourceIds.add(vid);
          docsToSync.push(this.buildVoucherDocument(v));
        }
        activeIdsByType.set("voucher", voucherSourceIds);
      }

      // 4. Collect WebsiteSettings
      if (types.includes("settings")) {
        const settings = await WebsiteSettings.findOne({ singletonKey: "default" }).lean();
        const settingsSourceIds = new Set();
        if (settings) {
          const sid = String(settings._id);
          settingsSourceIds.add(sid);
          docsToSync.push(this.buildWebsiteSettingsDocument(settings));
        }
        activeIdsByType.set("settings", settingsSourceIds);
      }

      this.syncState.progress.total = docsToSync.length;

      // Batch upsert all collected documents
      const batchResult = await this.upsertBatchDocuments(docsToSync, {
        force,
        batchSize,
        allowLocalFallback,
      });

      // Clean up orphaned vectors whose source records were deleted from DB
      let removedOrphaned = 0;
      for (const [sType, validIdsSet] of activeIdsByType.entries()) {
        const validIds = Array.from(validIdsSet);
        const delRes = await VectorEmbedding.deleteMany({
          sourceType: sType,
          sourceId: { $nin: validIds },
        });
        removedOrphaned += delRes.deletedCount || 0;
      }

      const summary = {
        status: "completed",
        totalDocuments: docsToSync.length,
        embedded: batchResult.embedded,
        reused: batchResult.reused,
        failed: batchResult.failed,
        removedOrphaned,
        totalTokens: batchResult.totalTokens,
        totalCostUsd: batchResult.totalCostUsd,
        durationMs: Date.now() - startTime,
        errors: batchResult.errors,
        timestamp: new Date(),
      };

      this.syncState.isRunning = false;
      this.syncState.status = "completed";
      this.syncState.lastCompletedAt = new Date();
      this.syncState.progress = {
        processed: docsToSync.length,
        total: docsToSync.length,
        embedded: batchResult.embedded,
        reused: batchResult.reused,
        failed: batchResult.failed,
        removedOrphaned,
      };
      this.syncState.lastSummary = summary;

      return summary;
    } catch (error) {
      this.syncState.isRunning = false;
      this.syncState.status = "failed";
      this.syncState.lastError = error.message;
      logger.error("VectorIndexService.syncAll failed:", error);
      throw error;
    }
  }

  /**
   * Get index statistics, dimension consistency, and sync status
   */
  async getIndexStats() {
    const [totalVectors, activeVectors, byType, modelBreakdown] = await Promise.all([
      VectorEmbedding.countDocuments({}),
      VectorEmbedding.countDocuments({ isActive: true }),
      VectorEmbedding.aggregate([
        { $group: { _id: "$sourceType", count: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } } } },
      ]),
      VectorEmbedding.aggregate([
        { $group: { _id: { model: "$embeddingModel", dimensions: "$dimensions" }, count: { $sum: 1 } } },
      ]),
    ]);

    const configuredDimensions = embeddingService.provider.dimensions || 1536;
    const configuredModel = embeddingService.provider.model;
    const hasDimensionMismatch = modelBreakdown.some(
      (m) => m._id?.dimensions && m._id.dimensions !== configuredDimensions
    );

    return {
      totalVectors,
      activeVectors,
      byType: Object.fromEntries(byType.map((item) => [item._id, { total: item.count, active: item.active }])),
      models: modelBreakdown.map((m) => ({
        model: m._id?.model,
        dimensions: m._id?.dimensions,
        count: m.count,
      })),
      configuredModel,
      configuredDimensions,
      needsReindex: hasDimensionMismatch,
      atlasVectorIndexDefinition: getAtlasVectorIndexDefinition(configuredDimensions),
      syncState: this.syncState,
    };
  }
}

const vectorIndexService = new VectorIndexService();
export default vectorIndexService;
