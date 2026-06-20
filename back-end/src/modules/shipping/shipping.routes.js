import express from "express";
import shippingController from "./shipping.controller.js";

const shippingRouter = express.Router();

shippingRouter.get("/", shippingController.getShippingFee);
shippingRouter.post("/calculate-fee", shippingController.calculateFee);


export default shippingRouter;