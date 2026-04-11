import ProductVariants from "../models/ProductVariants.js";

export const createProductVariant = async (req, res) => {
    try {
        const { product_id, color, size, stock, image_url } = req.body;
        const productVariant = new ProductVariants({
            product_id,
            color, size, stock, image_url
        });
        const newProduct = await productVariant.save();
        return res.status(201).json(newProduct);
    } catch (error) {
        console.error("Lỗi khi gọi createProduct:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const updateProductVariant = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updateProduct = await ProductVariants.findByIdAndUpdate(id, updateData, { new: true });
        return res.json(updateProduct);
    } catch (error) {
        console.error("Lỗi khi gọi updateProduct:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const deleteProductVariant = async (req, res) => {
    try {
        const { id } = req.params;
        const updateProduct = await ProductVariants.findByIdAndDelete(id);
        return res.json(updateProduct);
    } catch (error) {
        console.error("Lỗi khi gọi deleteProduct:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const getProductVariantByProductId = async (req, res) => {
    try {
        const { product_id } = req.params;
        const productVariants = await ProductVariants.find({ product_id });
        return res.json(productVariants);
    } catch (error) {
        console.error("Lỗi khi gọi getProductVariantByProductId:", error);  
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const getProductVariantById = async (req, res) => {
    try {
        const { id } = req.params;  
        const productVariant = await ProductVariants.findById(id);
        if (!productVariant) {
            return res.status(404).json({ message: "Không tìm thấy biến thể sản phẩm" });
        }   
        return res.json(productVariant);
    } catch (error) {
        console.error("Lỗi khi gọi getProductVariantById:", error);  
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}