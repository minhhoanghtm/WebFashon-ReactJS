import express from 'express';
import {  authMe, updatePassword, updateProfile } from '../controllers/userControllers.js';

const router = express.Router();

router.get("/me", authMe);
router.put("/updatePassword", updatePassword);
router.put("/updateProfile", updateProfile);

export default router;