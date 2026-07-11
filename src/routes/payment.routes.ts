import { Router } from "express";
import {
  createSetupIntent,
  getPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from "../controllers/payment.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.post("/setup-intent", protect, createSetupIntent);
router.get("/payment-methods", protect, getPaymentMethods);
router.delete("/payment-methods/:id", protect, deletePaymentMethod);
router.put("/payment-methods/:id/default", protect, setDefaultPaymentMethod);

export default router;
