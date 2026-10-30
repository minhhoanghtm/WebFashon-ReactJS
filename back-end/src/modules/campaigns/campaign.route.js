import express from "express";
import {
  getActiveCampaigns,
  getCampaignBySlug,
  getAdminCampaigns,
  getAdminCampaignDetail,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addCampaignProduct,
  updateCampaignProduct,
  removeCampaignProduct,
} from "./campaign.controller.js";
import {
  validateCreateCampaign,
  validateUpdateCampaign,
  validateAddCampaignProduct,
  validateUpdateCampaignProduct,
} from "./campaign.validator.js";

export const campaignRouter = express.Router();
export const adminCampaignRouter = express.Router();

// Public routes
campaignRouter.get("/active", getActiveCampaigns);
campaignRouter.get("/:slug", getCampaignBySlug);

// Admin routes (được bảo vệ bởi protectedRoute + adminOnly ở rootRouter)
adminCampaignRouter.get("/", getAdminCampaigns);
adminCampaignRouter.post("/", validateCreateCampaign, createCampaign);
adminCampaignRouter.get("/:id", getAdminCampaignDetail);
adminCampaignRouter.put("/:id", validateUpdateCampaign, updateCampaign);
adminCampaignRouter.delete("/:id", deleteCampaign);

// Admin campaign products
adminCampaignRouter.post("/:id/products", validateAddCampaignProduct, addCampaignProduct);
adminCampaignRouter.put("/:id/products/:productId", validateUpdateCampaignProduct, updateCampaignProduct);
adminCampaignRouter.delete("/:id/products/:productId", removeCampaignProduct);

export default campaignRouter;

