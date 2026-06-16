import express from "express";
import { getSettings, updateSettings } from "./websiteSettings.controller.js";
import { protectedRoute, adminOnly } from "../../middlewares/auth.middleware.js";
import { validateUpdateSettings } from "./websiteSettings.validator.js";

const websiteSettingsRouter = express.Router();

// Public: view settings
websiteSettingsRouter.get("/", getSettings);

// Admin: update settings (requires auth and admin privilege)
websiteSettingsRouter.put("/", protectedRoute, adminOnly, validateUpdateSettings, updateSettings);

export default websiteSettingsRouter;
