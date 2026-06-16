import PageSection from "./pageSection.model.js";
import Product from "../products/product.model.js";
import { validateSectionsArray } from "./pageSection.validator.js";
import { AppError } from "../../common/exceptions/AppError.js";

class PageSectionService {
  async getByPageId(pageId, populateProductsFlag = false) {
    const sections = await PageSection.find({ pageId }).sort({ order: 1 }).lean();
    if (populateProductsFlag) {
      await this.populateProducts(sections);
    }
    return sections;
  }

  async getByPageIds(pageIds) {
    return await PageSection.find({ pageId: { $in: pageIds }, isActive: true }).sort({ order: 1 }).lean();
  }

  async populateProducts(sections) {
    for (let sec of sections) {
      if (sec.type === "products" && sec.data?.productIds && sec.data.productIds.length > 0) {
        const prods = await Product.find({ _id: { $in: sec.data.productIds }, is_active: true }).lean();
        sec.data.products = prods;
      }
    }
    return sections;
  }

  async replaceByPageId(pageId, sections = [], session = null) {
    // Validate sections array before writing
    validateSectionsArray(sections);

    const bulkOps = [
      {
        deleteMany: {
          filter: { pageId }
        }
      }
    ];

    if (sections && sections.length > 0) {
      sections.forEach((sec, idx) => {
        bulkOps.push({
          insertOne: {
            document: {
              pageId,
              type: sec.type,
              order: sec.order !== undefined ? sec.order : idx,
              isActive: sec.isActive !== undefined ? sec.isActive : true,
              data: sec.data || {},
            }
          }
        });
      });
    }

    const options = session ? { session } : {};
    await PageSection.bulkWrite(bulkOps, options);
    return this.getByPageId(pageId);
  }

  async deleteByPageId(pageId, session = null) {
    const options = session ? { session } : {};
    await PageSection.deleteMany({ pageId }, options);
  }

  async reorderSections(pageId, orders = []) {
    // orders is an array of { sectionId, order }
    if (!Array.isArray(orders)) {
      throw new AppError("Danh sách thứ tự sắp xếp phải là mảng", 400);
    }

    const bulkOps = orders.map(item => ({
      updateOne: {
        filter: { _id: item.sectionId, pageId },
        update: { $set: { order: item.order } }
      }
    }));

    if (bulkOps.length > 0) {
      await PageSection.bulkWrite(bulkOps);
    }
    return this.getByPageId(pageId);
  }
}

export default new PageSectionService();
