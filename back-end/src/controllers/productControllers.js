import {
    createSlug
} from "../utils/slug.js";
import Product from "../models/Product.js";

export const addProduct = async (req, res) => {
    try {
        const {
            name
        } = req.body;
        const slug = createSlug(name);
        const product = await Product.create({
            ...req.body,
            slug
        });
        res.status(201).json(product);
    } catch (error) {
        console.error("Lỗi khi gọi addProduct:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const getAllProduct = async (req, res) => {
    try {
        const {
            sort = "createdAt", order = "desc"
        } = req.body;
        const sortOption = {};
        sort.split(",").forEach(element => {
            sortOption[element] = order === "asc" ? 1 : -1;
        });
        const products = await Product.find().sort(sortOption);
        return res.json(products);
    } catch (error) {
        console.error("Lỗi khi gọi getAllProduct:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}
export const getProductBySlug = async (req, res) => {
    try {
        const {
            slug
        } = req.params;
        await Product.find({
            slug
        });
    } catch (error) {
        console.error("Lỗi khi gọi getProductBySlug:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}
export const updateProduct = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const updateProduct = await Product.findByIdAndUpdate(id, req.body, {
            new: true
        });
        res.json(updateProduct);
    } catch (error) {
        console.error("Lỗi khi gọi updateProduct:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const updateProduct = await Product.findByIdAndDelete(id);
        return res.json(updateProduct);
    } catch (error) {
        console.error("Lỗi khi gọi deleteProduct:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const getProductByCategory = async (req, res) => {
    try {
        const {
            category
        } = req.params;
        const products = await Product.find({ category }); 
        return res.json(products);
    } catch (error) {
        console.error("Lỗi khi gọi getProductByCategory:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const getProductDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const productDetail = await Product.findById(id).populate("variants");   
        if (!product) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }   
        return res.json(productDetail);
    } catch (error) {
        console.error("Lỗi khi gọi getProductDetail:", error);
        res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}