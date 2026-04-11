import Category from "../models/Category.js";

export const createCategory = async (req, res) => {
    try {
        await Category.create(req.body);
        res.status(200).json({
            message: "Tạo danh mục thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi createCategory:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) {
        console.error("Lỗi khi gọi getAllCategories:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndUpdate(id, req.body);
        res.status(200).json({
            message: "Cập nhật danh mục thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi updateCategory:", error);
        res.status(500).json({  
            message: "Lỗi hệ thống"
        });
    }
}

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        res.status(200).json({
            message: "Xóa danh mục thành công"
        });
    } catch (error) {
        console.error("Lỗi khi gọi deleteCategory:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

