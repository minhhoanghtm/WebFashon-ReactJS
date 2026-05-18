import express from 'express';
import {
	authMe,
	createUser,
	deleteUser,
	getAllUsers,
	updatePassword,
	updateProfile,
	updateUser,
} from '../controllers/userControllers.js';
import { adminOnly, protectedRoute } from '../middleware/authMiddlewares.js';

const router = express.Router();

router.get("/me", authMe);
router.put("/updatePassword", updatePassword);
router.put("/updateProfile", updateProfile);
router.get("/admin/users", protectedRoute, adminOnly, getAllUsers);
router.post("/admin/users", protectedRoute, adminOnly, createUser);
router.put("/admin/users/:id", protectedRoute, adminOnly, updateUser);
router.delete("/admin/users/:id", protectedRoute, adminOnly, deleteUser);

export default router;