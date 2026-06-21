import express from "express";
import shippingController from "./shipping.controller.js";

const shippingRouter = express.Router();

shippingRouter.get("/provinces", shippingController.getShippingFee);
shippingRouter.get("/districts", shippingController.getDistricts);
shippingRouter.get("/wards", shippingController.getWards);
shippingRouter.post("/calculate-fee", shippingController.calculateFee);


export default shippingRouter;