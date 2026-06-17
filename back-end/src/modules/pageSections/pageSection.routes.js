import express from "express";
import {
  getSectionsByPageId,
  replaceSectionsByPageId,
  reorderSections
} from "./pageSection.controller.js";

const pageSectionRouter = express.Router();
const adminPageSectionRouter = express.Router();

// Public routes (registered at /page-sections)
pageSectionRouter.get("/:pageId", getSectionsByPageId);

// Admin routes (registered at /admin/page-sections)
adminPageSectionRouter.get("/:pageId", getSectionsByPageId);
adminPageSectionRouter.post("/:pageId/replace", replaceSectionsByPageId);
adminPageSectionRouter.put("/:pageId/replace", replaceSectionsByPageId);
adminPageSectionRouter.put("/:pageId/reorder", reorderSections);

export { pageSectionRouter, adminPageSectionRouter };
