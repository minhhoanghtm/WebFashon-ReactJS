import { createSlug } from "../utils/slug.js";
import Product from "../models/Product.js";
import ProductVariants from "../models/ProductVariants.js";
import { toNoAccent } from "../utils/removeAccents.js";

export const addProduct = async (req, res) => {
  try {
    const { name, variants = [], ...productBody } = req.body;
    const slug = createSlug(name);
    const name_no_accents = toNoAccent(name);

    const product = await Product.create({
      ...productBody,
      slug,
      name,
      name_no_accents,
    });

    if (Array.isArray(variants) && variants.length > 0) {
      const variantDocs = variants
        .filter((variant) => variant?.color && variant?.image_url)
        .map((variant) => ({
          product_id: product._id,
          color: variant.color,
          size: variant.size,
          stock: Number(variant.stock || 0),
          image_url: variant.image_url,
        }));

      if (variantDocs.length > 0) {
        await ProductVariants.insertMany(variantDocs, { ordered: false });
      }
    }

    res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      product,
    });
  } catch (error) {
    console.error("Lỗi khi gọi addProduct:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const getAllProduct = async (req, res) => {
  try {
    const { sort = "createdAt", order = "desc" } = req.body;
    const sortOption = {};
    sort.split(",").forEach((element) => {
      sortOption[element] = order === "asc" ? 1 : -1;
    });
    const products = await Product.find().sort(sortOption);
    return res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Lỗi khi gọi getAllProduct:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({
      slug,
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }
    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Lỗi khi gọi getProductBySlug:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { variants, ...productBody } = req.body;

    const updateProduct = await Product.findByIdAndUpdate(id, productBody, {
      new: true,
    });

    if (Array.isArray(variants)) {
      await ProductVariants.deleteMany({ product_id: id });

      const variantDocs = variants
        .filter((variant) => variant?.color && variant?.image_url)
        .map((variant) => ({
          product_id: id,
          color: variant.color,
          size: variant.size,
          stock: Number(variant.stock || 0),
          image_url: variant.image_url,
        }));

      if (variantDocs.length > 0) {
        await ProductVariants.insertMany(variantDocs, { ordered: false });
      }
    }

    res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: updateProduct,
    });
  } catch (error) {
    console.error("Lỗi khi gọi updateProduct:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateProduct = await Product.findByIdAndDelete(id);
    return res.json({
      success: true,
      message: "Xóa sản phẩm thành công",
      data: updateProduct,
    });
  } catch (error) {
    console.error("Lỗi khi gọi deleteProduct:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const getProductByCategory = async (req, res) => {
  try {
    const { categoryid } = req.params;
    const limit = Math.min(Number(req.query.limit) || 6, 12); // Giới hạn tối đa là 12
    const products = await Product.find({ category_id: categoryid }).limit(
      limit,
    );
    return res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Lỗi khi gọi getProductByCategory:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const productDetail = await Product.findById(id).populate("variants");
    if (!productDetail) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    return res.json({
      success: true,
      data: productDetail,
    });
  } catch (error) {
    console.error("Lỗi khi gọi getProductDetail:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const suggestProducts = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp từ khóa gợi ý",
      });
    }

    const key = toNoAccent(keyword.trim());

    const products = await Product.find({
      is_active: true,
      name_no_accents: {
        $regex: key,
        $options: "i",
      },
    })
      .select("name slug displayProduct")
      .limit(10);

    return res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Suggest error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi gợi ý sản phẩm",
    });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      rating,
      sort,
    } = req.query;

    const query = {
      is_active: true,
    };

    // SEARCH (không dấu)
    if (search?.trim()) {
      const keyword = toNoAccent(search.trim());

      query.name_no_accents = {
        $regex: keyword,
        $options: "i",
      };
    }

    // CATEGORY
    if (category) {
      // hỗ trợ nhiều category: ?category=a,b,c
      const categories = category.split(",");

      query.category_id = {
        $in: categories,
      };
    }

    // PRICE
    if (minPrice || maxPrice) {
      query.new_price = {};

      if (minPrice) {
        query.new_price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        query.new_price.$lte = Number(maxPrice);
      }
    }

    // RATING
    if (rating) {
      query.rating = {
        $gte: Number(rating),
      };
    }

    // PAGINATION
    const currentPage = Math.max(Number(page), 1);
    const perPage = Math.max(Number(limit), 1);

    const skip = (currentPage - 1) * perPage;

    // SORT
    let sortOption = { createdAt: -1 };

    switch (sort) {
      case "price_asc":
        sortOption = { new_price: 1 };
        break;

      case "price_desc":
        sortOption = { new_price: -1 };
        break;

      case "rating":
        sortOption = { rating: -1 };
        break;

      case "newest":
        sortOption = { createdAt: -1 };
        break;

      default:
        sortOption = { createdAt: -1 };
    }

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(perPage).lean(),

      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: currentPage,
        limit: perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Search error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm sản phẩm",
    });
  }
};

export const getSlugByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }
    res.json({
      success: true,
      slug: product.slug,
    });
  } catch (error) {
    console.error("Lỗi khi gọi getSlugByProductId:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};
