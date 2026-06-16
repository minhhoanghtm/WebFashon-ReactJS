import pageSectionService from "./pageSection.service.js";
import { successResponse } from "../../common/responses/index.js";

export const getSectionsByPageId = async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const sections = await pageSectionService.getByPageId(pageId, true);
    return successResponse(res, sections, "Lấy danh sách khối nội dung thành công");
  } catch (error) {
    next(error);
  }
};

export const replaceSectionsByPageId = async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const { sections } = req.body;
    const updatedSections = await pageSectionService.replaceByPageId(pageId, sections);
    return successResponse(res, updatedSections, "Cập nhật danh sách khối nội dung thành công");
  } catch (error) {
    next(error);
  }
};

export const reorderSections = async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const { orders } = req.body;
    const updatedSections = await pageSectionService.reorderSections(pageId, orders);
    return successResponse(res, updatedSections, "Cập nhật thứ tự khối nội dung thành công");
  } catch (error) {
    next(error);
  }
};
