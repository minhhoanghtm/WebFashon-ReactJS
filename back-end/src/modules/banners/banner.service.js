import bannerRepository from "./banner.repository.js";
import { AppError } from "../../common/exceptions/AppError.js";

class BannerService {
  async getActiveBanners() {
    const now = new Date();
    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };
    // Sort by sortOrder ASC, then createdAt DESC
    return await bannerRepository.find(query, { sortOrder: 1, createdAt: -1 });
  }

  async getAllBanners(queryParams) {
    const { page = 1, limit = 10, keyword, position, status } = queryParams;
    const query = {};

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { subtitle: { $regex: keyword, $options: "i" } }
      ];
    }
    if (position) {
      query.position = position;
    }
    if (status !== undefined && status !== "") {
      query.isActive = status === "true" || status === true;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

    const items = await bannerRepository.find(query, { sortOrder: 1, createdAt: -1 }, skip, limitNum);
    const totalItems = await bannerRepository.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    return {
      items,
      pagination: {
        page: Number(page),
        limit: limitNum,
        totalPages,
        total: totalItems,
      }
    };
  }

  async getBannerById(id) {
    const banner = await bannerRepository.findById(id);
    if (!banner) {
      throw new AppError("Banner không tồn tại hoặc đã bị xóa", 404);
    }
    return banner;
  }

  async createBanner(adminId, bannerData) {
    const newBanner = await bannerRepository.create({
      ...bannerData,
      createdBy: adminId,
      updatedBy: adminId,
    });
    return newBanner;
  }

  async updateBanner(adminId, id, bannerData) {
    const banner = await bannerRepository.findById(id);
    if (!banner) {
      throw new AppError("Banner không tồn tại hoặc đã bị xóa", 404);
    }
    
    // Check targetType logic if updated
    if (bannerData.startDate && bannerData.endDate) {
      if (new Date(bannerData.startDate) >= new Date(bannerData.endDate)) {
        throw new AppError("Dữ liệu không hợp lệ: Ngày kết thúc phải lớn hơn ngày bắt đầu", 400);
      }
    } else {
      const finalStart = bannerData.startDate ? new Date(bannerData.startDate) : new Date(banner.startDate);
      const finalEnd = bannerData.endDate ? new Date(bannerData.endDate) : new Date(banner.endDate);
      if (finalStart >= finalEnd) {
        throw new AppError("Dữ liệu không hợp lệ: Ngày kết thúc phải lớn hơn ngày bắt đầu", 400);
      }
    }

    // Specific target validations
    const finalTargetType = bannerData.targetType !== undefined ? bannerData.targetType : banner.targetType;
    const finalTargetId = bannerData.targetId !== undefined ? bannerData.targetId : banner.targetId;
    const finalLinkUrl = bannerData.linkUrl !== undefined ? bannerData.linkUrl : banner.linkUrl;

    if (finalTargetType === "product" && (!finalTargetId || finalTargetId.trim() === "")) {
      throw new AppError("Dữ liệu không hợp lệ: Mã sản phẩm liên kết (targetId) là bắt buộc khi targetType là product", 400);
    }
    if (finalTargetType === "category" && (!finalTargetId || finalTargetId.trim() === "")) {
      throw new AppError("Dữ liệu không hợp lệ: Mã danh mục liên kết (targetId) là bắt buộc khi targetType là category", 400);
    }
    if (finalTargetType === "lookbook" && (!finalTargetId || finalTargetId.trim() === "")) {
      throw new AppError("Dữ liệu không hợp lệ: Slug / ID của Lookbook liên kết (targetId) là bắt buộc khi targetType là lookbook", 400);
    }

    const updated = await bannerRepository.findOneAndUpdate(
      { _id: id },
      { ...bannerData, updatedBy: adminId },
      { new: true }
    );
    return updated;
  }

  async toggleBannerStatus(adminId, id) {
    const banner = await bannerRepository.findById(id);
    if (!banner) {
      throw new AppError("Banner không tồn tại hoặc đã bị xóa", 404);
    }
    const updated = await bannerRepository.findOneAndUpdate(
      { _id: id },
      { isActive: !banner.isActive, updatedBy: adminId },
      { new: true }
    );
    return updated;
  }

  async deleteBanner(adminId, id) {
    const banner = await bannerRepository.findById(id);
    if (!banner) {
      throw new AppError("Banner không tồn tại hoặc đã bị xóa", 404);
    }
    // Perform Soft Delete
    await bannerRepository.findOneAndUpdate(
      { _id: id },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: adminId,
      }
    );
    return { id };
  }

  async trackClick(id) {
    const banner = await bannerRepository.findById(id);
    if (!banner) {
      throw new AppError("Banner không tồn tại hoặc đã bị xóa", 404);
    }
    const updated = await bannerRepository.findOneAndUpdate(
      { _id: id },
      { $inc: { clickCount: 1 } },
      { new: true }
    );
    return updated;
  }
}

export default new BannerService();
