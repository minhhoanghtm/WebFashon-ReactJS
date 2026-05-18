import Category from "../models/Category.js";

export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error("Lỗi khi gọi getAllCategories:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống"
        });
    }
}

export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Danh mục không tồn tại"
            });
        }
        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error("Lỗi khi gọi getCategoryById:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống"
        });
    }
};

export const createCategory = async (req, res) => {
    try {
        await Category.create(req.body);
        res.status(200).json({
            success: true,
            message: "Tạo danh mục thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi createCategory:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống"
        });
    }
}

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndUpdate(id, req.body);
        res.status(200).json({
            success: true,
            message: "Cập nhật danh mục thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi updateCategory:", error);
        res.status(500).json({  
            success: false,
            message: "Lỗi hệ thống"
        });
    }
}

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Xóa danh mục thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi deleteCategory:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống"
        });
    }
}

