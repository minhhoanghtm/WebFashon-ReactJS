import express from "express";
import { validateVoucher, getVouchers } from "./voucher.controller.js";

const voucherRouter = express.Router();

voucherRouter.get("/", getVouchers);
voucherRouter.post("/validate", validateVoucher);

export default voucherRouter;
