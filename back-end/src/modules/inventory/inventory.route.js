import express from "express";
import {
  createCheckoutReservation,
  getReservationDetail,
  releaseReservation,
  checkAvailability,
} from "./inventory.controller.js";
import { optionalProtectedRoute } from "../../middlewares/auth.middleware.js";

const inventoryRouter = express.Router();

inventoryRouter.get("/availability", checkAvailability);
inventoryRouter.post("/reservations", optionalProtectedRoute, createCheckoutReservation);
inventoryRouter.get("/reservations/:id", optionalProtectedRoute, getReservationDetail);
inventoryRouter.post("/reservations/:id/release", optionalProtectedRoute, releaseReservation);
inventoryRouter.post("/reservations/:id/cancel", optionalProtectedRoute, releaseReservation);

export const checkoutReservationRouter = express.Router();
checkoutReservationRouter.post("/reservations", optionalProtectedRoute, createCheckoutReservation);
checkoutReservationRouter.get("/reservations/:id", optionalProtectedRoute, getReservationDetail);
checkoutReservationRouter.post("/reservations/:id/cancel", optionalProtectedRoute, releaseReservation);

export default inventoryRouter;
