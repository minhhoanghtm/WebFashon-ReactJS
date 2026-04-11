import express from 'express';
import {  authMe } from '../controllers/userControllers.js';

const router = express.Router();

router.get("/me", authMe);
// router.post("/", addUser);


export default router;