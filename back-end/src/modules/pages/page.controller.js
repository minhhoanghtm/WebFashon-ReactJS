import pageService from "./page.service.js";
import { successResponse } from "../../common/responses/index.js";
import { AppError } from "../../common/exceptions/AppError.js";
import getRedisConnection from "../../configs/redis.js";
import { LOOKBOOK_LIST_PROJECTION } from "../../configs/constants.js";

export const getPages = async (req, res, next) => {
  try {
    const filters = {
      type: req.query.type,
      status: req.query.status,
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: req.query.page,
      limit: req.query.limit,
      excludeType: req.query.excludeType,
    };
    const data = await pageService.getPages(filters);
    return successResponse(res, data, "Lấy danh sách trang thành công");
  } catch (error) {
    next(error);
  }
};

export const getPageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const page = await pageService.getPageBySlug(slug);
    return successResponse(res, page, "Lấy chi tiết trang thành công");
  } catch (error) {
    next(error);
  }
};

export const getPageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = await pageService.getPageById(id);
    return successResponse(res, page, "Lấy chi tiết trang thành công");
  } catch (error) {
    next(error);
  }
};

export const createPage = async (req, res, next) => {
  try {
    const page = await pageService.createPage(req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo trang thành công",
      data: page,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = await pageService.updatePage(id, req.body);
    return successResponse(res, page, "Cập nhật trang thành công");
  } catch (error) {
    next(error);
  }
};

export const deletePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pageService.deletePage(id);
    return successResponse(res, null, "Xóa trang thành công");
  } catch (error) {
    next(error);
  }
};

// Lookbook wrappers/facades
export const getLookbooks = async (req, res, next) => {
  try {
    const filters = {
      ...req.query,
      type: "lookbook",
      status: "published",
      select: LOOKBOOK_LIST_PROJECTION,
    };
    const data = await pageService.getPages(filters);
    return successResponse(res, data, "Lấy danh sách lookbook thành công");
  } catch (error) {
    next(error);
  }
};

export const getFeaturedLookbook = async (req, res, next) => {
  try {
    const data = await pageService.getFeaturedLookbook();
    return successResponse(res, data, "Lấy lookbook nổi bật thành công");
  } catch (error) {
    next(error);
  }
};

export const getLookbookBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const page = await pageService.getPageBySlug(slug);

    if (page.type !== "lookbook" || page.status !== "published") {
      return next(new AppError("Lookbook không tồn tại hoặc chưa được xuất bản", 404));
    }

    // Fetch related lookbooks (recommendations) directly from DB
    const relatedLookbooksResult = await pageService.getPages({
      type: "lookbook",
      status: "published",
      excludeSlug: slug,
      sortBy: "publishedAt",
      sortOrder: "desc",
      limit: 4,
      page: 1
    });

    // Extract products from products sections
    let relatedProducts = [];
    if (page.sections) {
      page.sections.forEach(s => {
        if (s.type === "products" && s.data?.products) {
          relatedProducts = [...relatedProducts, ...s.data.products];
        }
      });
    }

    // Remove duplicate products by _id
    const uniqueProductsMap = {};
    relatedProducts.forEach(p => {
      uniqueProductsMap[p._id.toString()] = p;
    });
    const uniqueProducts = Object.values(uniqueProductsMap);

    return successResponse(
      res,
      {
        page,
        relatedProducts: uniqueProducts,
        relatedLookbooks: relatedLookbooksResult.pages || []
      },
      "Lấy chi tiết lookbook thành công"
    );
  } catch (error) {
    next(error);
  }
};

export const incrementPageView = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const cacheKey = `view:${slug}:${ip}`;

    let isAlreadyCounted = false;

    try {
      const redis = getRedisConnection();
      if (redis) {
        const exists = await redis.get(cacheKey);
        if (exists) {
          isAlreadyCounted = true;
        } else {
          // Set TTL of 600 seconds (10 minutes)
          await redis.set(cacheKey, "1", "EX", 600);
        }
      } else {
        console.warn("Redis unavailable, view deduplication skipped");
      }
    } catch (redisError) {
      console.warn("Redis error during view deduplication check:", redisError.message);
    }

    if (isAlreadyCounted) {
      return successResponse(res, null, "Lượt xem đã được ghi nhận trước đó");
    }

    const page = await pageService.incrementPageViewBySlug(slug);
    return successResponse(res, { viewCount: page.viewCount }, "Ghi nhận lượt xem thành công");
  } catch (error) {
    next(error);
  }
};

export const getAdminPageDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const combined = await pageService.getPageById(id);
    const { sections, ...pageMetadata } = combined;
    return successResponse(res, { page: pageMetadata, sections }, "Lấy chi tiết trang thành công");
  } catch (error) {
    next(error);
  }
};

export const toggleFeaturePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = await pageService.toggleFeaturePage(id);
    return successResponse(res, page, "Cập nhật trạng thái nổi bật thành công");
  } catch (error) {
    next(error);
  }
};

