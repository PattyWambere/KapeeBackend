import { Router } from "express";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  cancelOrder,
  createPaymentIntent
} from "../controllers/order.controller";

import { protect } from "../middleware/auth.middleware";

const router = Router();

/* ================= ORDERS ================= */

// Get all orders
router.get("/orders", protect, getOrders);

// Get single order
router.get("/orders/:id", protect, getOrderById);

// Create order (checkout) – TRANSACTION
router.post("/createOrders", protect, createOrder);

// Create Stripe PaymentIntent
router.post("/create-payment-intent", protect, createPaymentIntent);

// Update order status (admin/vendor/customer rules)
router.put("/updateOrders/:id", protect, updateOrder);

// Cancel order – TRANSACTION + restore stock
router.patch("/cancelOrders/:id/cancel", protect, cancelOrder);

// Delete order
router.delete("/deleteOrders/:id", protect, deleteOrder);

export default router;
