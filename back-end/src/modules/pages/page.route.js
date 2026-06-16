import express from "express";
import {
  getPages,
  getPageBySlug,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  getLookbooks,
  getFeaturedLookbook,
  getLookbookBySlug,
  incrementPageView,
  getAdminPageDetail,
  toggleFeaturePage,
} from "./page.controller.js";
import { validatePage } from "./page.validator.js";

const pageRouter = express.Router();
const adminPageRouter = express.Router();
const lookbookRouter = express.Router();

// Public routes (registered at /pages)
pageRouter.get("/", getPages);
pageRouter.get("/:slug", getPageBySlug);
pageRouter.patch("/:slug/view", incrementPageView);

// Lookbook routes (registered at /lookbooks)
lookbookRouter.get("/", getLookbooks);
lookbookRouter.get("/featured", getFeaturedLookbook);
lookbookRouter.get("/:slug", getLookbookBySlug);

// Admin routes (registered at /admin/pages)
adminPageRouter.get("/", getPages);
adminPageRouter.get("/:id/detail", getAdminPageDetail);
adminPageRouter.get("/:id", getPageById);
adminPageRouter.post("/", validatePage, createPage);
adminPageRouter.put("/:id", validatePage, updatePage);
adminPageRouter.delete("/:id", deletePage);
adminPageRouter.put("/:id/feature", toggleFeaturePage);

export { pageRouter, adminPageRouter, lookbookRouter };

