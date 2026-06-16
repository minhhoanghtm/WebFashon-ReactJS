import Page from "./page.model.js";
import pageSectionService from "../pageSections/pageSection.service.js";
import { AppError } from "../../common/exceptions/AppError.js";
import getRedisConnection from "../../configs/redis.js";

const memoryCache = {
  data: null,
  expiry: 0
};

class PageService {
  async getPages(filters = {}) {
    const {
      type,
      status,
      search,
      excludeSlug,
      sortBy = "displayOrder",
      sortOrder = "asc",
      page = 1,
      limit = 10,
      select,
      excludeFeatured,
      excludeType
    } = filters;

    const query = {};

    if (type) {
      query.type = type;
    } else if (excludeType) {
      query.type = { $ne: excludeType };
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    let slugsToExclude = [];
    if (excludeSlug) {
      slugsToExclude.push(excludeSlug);
    }

    if (excludeFeatured === "true" || excludeFeatured === true) {
      const featured = await this.getFeaturedLookbook();
      if (featured) {
        slugsToExclude.push(featured.slug);
      }
    }

    if (slugsToExclude.length > 0) {
      query.slug = { $nin: slugsToExclude };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    let mongooseQuery = Page.find(query);
    if (select) {
      mongooseQuery = mongooseQuery.select(select);
    }

    const [rawPages, total] = await Promise.all([
      mongooseQuery.sort(sort).skip(skip).limit(take).lean(),
      Page.countDocuments(query),
    ]);

    const pageIds = rawPages.map(p => p._id);
    const sections = await pageSectionService.getByPageIds(pageIds);

    // Group sections by pageId using O(n) Hash Map
    const sectionsByPageId = {};
    sections.forEach(s => {
      const pid = s.pageId.toString();
      if (!sectionsByPageId[pid]) {
        sectionsByPageId[pid] = [];
      }
      sectionsByPageId[pid].push(s);
    });

    // Assign sections and map cover images dynamically
    const pages = rawPages.map(p => {
      const pageSections = sectionsByPageId[p._id.toString()] || [];
      const normalizedPage = {
        ...p,
        sections: pageSections
      };
      if (p.type === "lookbook") {
        return this.normalizeLookbook(normalizedPage);
      }
      return normalizedPage;
    });

    return {
      pages,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  normalizeLookbook(lookbook) {
    if (!lookbook) return null;
    
    // Find first hero or banner section to extract cover image dynamically if not explicitly set
    const firstHero = lookbook.sections?.find(s => s.type === "hero" || s.type === "banner" || s.type === "image_text");
    const resolvedCover = lookbook.thumbnailUrl || lookbook.bannerUrl || firstHero?.data?.coverImage || firstHero?.data?.image || "";

    return {
      ...lookbook,
      thumbnailUrl: resolvedCover,
      bannerUrl: resolvedCover
    };
  }

  async getFeaturedLookbook() {
    const cacheKey = "lookbook:featured";
    const ttl = 300; // 5 minutes

    const redis = getRedisConnection();
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        console.error("Lỗi đọc cache Redis cho featured lookbook:", err.message);
      }
    } else {
      const now = Date.now();
      if (memoryCache.data && memoryCache.expiry > now) {
        return memoryCache.data;
      }
    }

    // Find lookbook marked explicitly as featured first
    let featured = await Page.findOne({ type: "lookbook", status: "published", isFeatured: true }).lean();

    if (!featured) {
      // Find the published lookbook with highest displayOrder or viewCount
      featured = await Page.findOne({ type: "lookbook", status: "published" })
        .sort({ viewCount: -1, publishedAt: -1, createdAt: -1 })
        .lean();
    }

    if (!featured) return null;

    // Fetch sections for featured lookbook
    const sections = await this.getPageSectionsByPageId(featured._id);
    const normalized = this.normalizeLookbook({ ...featured, sections });

    if (redis && normalized) {
      try {
        await redis.set(cacheKey, JSON.stringify(normalized), "EX", ttl);
      } catch (err) {
        console.error("Lỗi ghi cache Redis cho featured lookbook:", err.message);
      }
    } else if (normalized) {
      memoryCache.data = normalized;
      memoryCache.expiry = Date.now() + ttl * 1000;
    }

    return normalized;
  }

  async getPageSectionsByPageId(pageId) {
    return await pageSectionService.getByPageId(pageId);
  }

  async savePageSections(pageId, sections = [], session = null) {
    return await pageSectionService.replaceByPageId(pageId, sections, session);
  }

  async getPageBySlug(slug) {
    const page = await Page.findOne({ slug }).lean();
    if (!page) {
      throw new AppError("Trang không tồn tại", 404);
    }
    const sections = await pageSectionService.getByPageId(page._id, true);

    const populatedPage = { ...page, sections };
    if (page.type === "lookbook") {
      return this.normalizeLookbook(populatedPage);
    }
    return populatedPage;
  }

  async getPageById(id) {
    const page = await Page.findById(id).lean();
    if (!page) {
      throw new AppError("Trang không tồn tại", 404);
    }
    const sections = await pageSectionService.getByPageId(page._id, true);

    const populatedPage = { ...page, sections };
    if (page.type === "lookbook") {
      return this.normalizeLookbook(populatedPage);
    }
    return populatedPage;
  }

  async incrementPageViewBySlug(slug) {
    const page = await Page.findOneAndUpdate(
      { slug },
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!page) {
      throw new AppError("Trang không tồn tại", 404);
    }
    return page;
  }

  async createPage(pageData) {
    // Check if slug is unique
    const existing = await Page.findOne({ slug: pageData.slug });
    if (existing) {
      throw new AppError("Slug đã tồn tại, vui lòng chọn slug khác", 400);
    }

    if (pageData.status === "published" && !pageData.publishedAt) {
      pageData.publishedAt = new Date();
    }

    // Sync productIds from products blocks to Page relatedProducts for backward compatibility
    const relatedProducts = [];
    if (pageData.sections) {
      pageData.sections.forEach(s => {
        if (s.type === "products" && s.data?.productIds) {
          s.data.productIds.forEach(pid => {
            if (!relatedProducts.includes(pid)) {
              relatedProducts.push(pid);
            }
          });
        }
      });
    }
    pageData.relatedProducts = relatedProducts;

    let page;
    let session = null;
    try {
      session = await Page.startSession();
      session.startTransaction();
    } catch (sessionError) {
      session = null;
    }

    if (session) {
      try {
        const pageArr = await Page.create([pageData], { session });
        page = pageArr[0];

        if (pageData.sections) {
          await this.savePageSections(page._id, pageData.sections, session);
        }

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      // Fallback manual rollback logic
      page = await Page.create(pageData);
      try {
        if (pageData.sections) {
          await this.savePageSections(page._id, pageData.sections);
        }
      } catch (error) {
        // Rollback created page metadata to prevent orphaned record
        await Page.findByIdAndDelete(page._id);
        throw error;
      }
    }

    return page;
  }

  async updatePage(id, pageData) {
    // Check if another page has the same slug
    if (pageData.slug) {
      const existing = await Page.findOne({ slug: pageData.slug, _id: { $ne: id } });
      if (existing) {
        throw new AppError("Slug đã tồn tại, vui lòng chọn slug khác", 400);
      }
    }

    if (pageData.status === "published" && !pageData.publishedAt) {
      pageData.publishedAt = new Date();
    }

    // Sync productIds from products blocks to Page relatedProducts
    const relatedProducts = [];
    if (pageData.sections) {
      pageData.sections.forEach(s => {
        if (s.type === "products" && s.data?.productIds) {
          s.data.productIds.forEach(pid => {
            if (!relatedProducts.includes(pid)) {
              relatedProducts.push(pid);
            }
          });
        }
      });
      pageData.relatedProducts = relatedProducts;
    }

    let updated;
    let session = null;
    try {
      session = await Page.startSession();
      session.startTransaction();
    } catch (sessionError) {
      session = null;
    }

    if (session) {
      try {
        updated = await Page.findByIdAndUpdate(id, pageData, { new: true, session });
        if (!updated) {
          throw new AppError("Trang không tồn tại", 404);
        }

        if (pageData.sections) {
          await this.savePageSections(id, pageData.sections, session);
        }

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      // Fallback manual rollback logic
      const originalPage = await Page.findById(id).lean();
      if (!originalPage) {
        throw new AppError("Trang không tồn tại", 404);
      }

      updated = await Page.findByIdAndUpdate(id, pageData, { new: true });
      try {
        if (pageData.sections) {
          await this.savePageSections(id, pageData.sections);
        }
      } catch (error) {
        // Rollback page metadata to the original state
        await Page.findByIdAndUpdate(id, originalPage);
        throw error;
      }
    }

    // Clear cache if needed
    const redis = getRedisConnection();
    if (redis) {
      await redis.del("lookbook:featured");
    } else {
      memoryCache.data = null;
    }

    return updated;
  }

  async deletePage(id) {
    let deleted;
    let session = null;
    try {
      session = await Page.startSession();
      session.startTransaction();
    } catch (sessionError) {
      session = null;
    }

    if (session) {
      try {
        deleted = await Page.findByIdAndDelete(id, { session });
        if (!deleted) {
          throw new AppError("Trang không tồn tại", 404);
        }
        await pageSectionService.deleteByPageId(id, session);
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      deleted = await Page.findByIdAndDelete(id);
      if (!deleted) {
        throw new AppError("Trang không tồn tại", 404);
      }
      try {
        await pageSectionService.deleteByPageId(id);
      } catch (error) {
        // Rollback page deletion by restoring metadata
        await Page.create({ ...deleted });
        throw error;
      }
    }

    const redis = getRedisConnection();
    if (redis) {
      await redis.del("lookbook:featured");
    } else {
      memoryCache.data = null;
    }

    return deleted;
  }

  async toggleFeaturePage(id) {
    const page = await Page.findById(id);
    if (!page) {
      throw new AppError("Trang không tồn tại", 404);
    }
    if (page.type !== "lookbook") {
      throw new AppError("Chỉ có thể gắn nổi bật cho lookbook", 400);
    }

    const nextFeaturedState = !page.isFeatured;

    if (nextFeaturedState) {
      // Set all other lookbooks' isFeatured to false
      await Page.updateMany({ type: "lookbook", _id: { $ne: id } }, { isFeatured: false });
    }

    page.isFeatured = nextFeaturedState;
    await page.save();

    // Clear cache
    const redis = getRedisConnection();
    if (redis) {
      await redis.del("lookbook:featured");
    } else {
      memoryCache.data = null;
    }

    return page;
  }
}

export default new PageService();

