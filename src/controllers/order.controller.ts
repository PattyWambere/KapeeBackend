import { Request, Response } from "express";
import { orderModel } from "../models/order.model";
import { v4 as uuidv4 } from "uuid";
import { ProductModel } from "../models/product.model";
import { CartModel } from "../models/cart.model";
import { userModel } from "../models/user.model";
import { sendEmail } from "../services/email.service";
import mongoose from "mongoose";
import Stripe from "stripe";

// Initialize Stripe if secret key is configured
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           example: "35282fa0-a182-4f1c-b6b6-bcd73671325e"
 *         quantity:
 *           type: number
 *           example: 2
 *         price:
 *           type: number
 *           example: 1000
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "c1a2b3d4"
 *         userId:
 *           type: string
 *           example: "u123"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: number
 *           example: 2000
 *         status:
 *           type: string
 *           example: "pending"
 */

/**
 * GET ALL ORDERS
 */
/**
 * @swagger
 * /api/orders/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
export const getOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const role = (req as any).role;

    // Admin sees all, customers see only their own
    const query = role === "admin" ? {} : { customerId: userId };
    const orders = await orderModel.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/**
 * GET ORDER BY ID
 */
/**
 * @swagger
 * /api/orders/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const role = (req as any).role;
    const order = await orderModel.findOne({ id: req.params.id }).populate("items.productId", "name images price");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Check ownership
    if (role !== "admin" && order.customerId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized access to this order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * CREATE ORDER (CHECKOUT FROM CART)
 */
/**
 * @swagger
 * /api/orders/createOrders:
 *   post:
 *     summary: Create a new order from cart (checkout)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Cart is empty or insufficient stock
 *       404:
 *         description: Product not found
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { paymentMethod, paymentDetails } = req.body;

    const cart = await CartModel.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of cart.items) {
      const product = await ProductModel.findOne({ id: item.productId } as any);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}` });
      }

      product.quantity -= item.quantity;
      if (product.quantity === 0) product.inStock = false;
      await product.save();

      totalAmount += product.price * item.quantity;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Determine initial payment status based on payment method
    // For cash on delivery, paymentStatus starts as pending
    // For card payments, paymentStatus should be marked as paid since it was authorized/confirmed
    const orderPaymentStatus = paymentMethod === "card" ? "paid" : "pending";

    const order = await orderModel.create(
      [
        {
          id: uuidv4(),
          customerId: userId,
          items: orderItems,
          totalAmount,
          status: "pending",
          paymentMethod: paymentMethod || "cod",
          paymentStatus: orderPaymentStatus,
          paymentDetails: paymentDetails || {},
        },
      ]
    );

    cart.items = [];
    await cart.save();

    return res.status(201).json(order[0]);
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ message: "Order creation failed" });
  }
};

/**
 * CREATE PAYMENT INTENT (STRIPE)
 */
/**
 * @swagger
 * /api/orders/create-payment-intent:
 *   post:
 *     summary: Create a Stripe PaymentIntent for the cart
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: PaymentIntent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *                   example: "pi_1234_secret_5678"
 *                 totalAmount:
 *                   type: number
 *                   example: 2000
 *       400:
 *         description: Cart is empty or Stripe is not configured
 *       500:
 *         description: Server error
 */
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { paymentMethodId } = req.body || {};

    if (!stripe) {
      return res.status(400).json({
        message: "Stripe payment gateway is not configured on the server. Please use simulated card payment mode.",
        fallback: true
      });
    }

    const cart = await CartModel.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalAmount = 0;
    for (const item of cart.items) {
      const product = await ProductModel.findOne({ id: item.productId } as any);
      if (product) {
        totalAmount += product.price * item.quantity;
      }
    }

    // Stripe expects amount in cents
    const amountInCents = Math.round(totalAmount * 100);

    // If using a saved card, attach the customer and confirm immediately
    if (paymentMethodId) {
      const user = await userModel.findById(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ message: "Customer not found for saved payment method" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        customer: user.stripeCustomerId,
        payment_method: paymentMethodId,
        confirm: true,
        metadata: { userId },
        // For confirming off-session or without redirect:
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        totalAmount,
        status: paymentIntent.status,
      });
    }

    // Regular flow for new cards
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: { userId },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      totalAmount,
    });
  } catch (error: any) {
    console.error("Create PaymentIntent error:", error);
    return res.status(500).json({ message: "Failed to create payment intent", error: error.message });
  }
};



/**
 * @swagger
 * /api/orders/cancelOrders/{id}/cancel:
 *   patch:
 *     summary: Cancel an order and restore stock
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Invalid order state
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */


export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const role = (req as any).role;
    const { id } = req.params;

    const order = await orderModel.findOne({ id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (role === "customer" && order.customerId.toString() !== userId) {
      return res.status(403).json({ message: "Not your order" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Only pending orders can be cancelled" });
    }

    for (const item of order.items) {
      const product = await ProductModel.findById(item.productId);
      if (!product) continue;

      product.quantity += item.quantity;
      product.inStock = true;
      await product.save();
    }

    order.status = "cancelled";
    await order.save();

    return res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({ message: "Order cancellation failed" });
  }
};




/**
 * UPDATE ORDER STATUS
 *
 * Rules:
 * - Admin: can update any order to any status
 * - Vendor: can update orders containing their products → shipped, delivered
 * - Customer: can cancel ONLY their own pending orders
 */

/**
 * @swagger
 * /api/orders/updateOrders/{id}:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Invalid status or invalid state
 *       403:
 *         description: Forbidden – role or ownership violation
 *       404:
 *         description: Order not found
 */
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).userId;
    const role = (req as any).role as "admin" | "vendor" | "customer";

    const allowedStatuses = ["pending", "shipped", "delivered", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await orderModel.findOne({ id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    /* ================= ADMIN ================= */
    if (role === "admin") {
      const oldStatus = order.status;
      order.status = status;
      await order.save();

      // Notify customer if status actually changed
      if (oldStatus !== status) {
        try {
          const user = await userModel.findById(order.customerId);
          if (user) {
            await sendEmail(
              user.email,
              `Update on your Order #${order.id.split("-")[0].toUpperCase()}`,
              `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px;">
                <h1 style="color: #1a1a1b; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em;">Order Status Updated</h1>
                <p style="color: #4a4a4a; line-height: 1.6;">Hello ${user.firstName},</p>
                <p style="color: #4a4a4a; line-height: 1.6;">Your order <strong>#${order.id.split("-")[0].toUpperCase()}</strong> has been updated to <strong>${status.toUpperCase()}</strong>.</p>
                <div style="margin: 30px 0; background: #f8f8f8; padding: 20px; border-radius: 12px; border-left: 4px solid #3b82f6;">
                  <span style="font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">New Status</span>
                  <span style="font-size: 18px; font-weight: 800; color: #3b82f6; text-transform: uppercase;">${status}</span>
                </div>
                <p style="color: #4a4a4a; line-height: 1.6;">You can track your order live on our dashboard:</p>
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/orders" style="display: inline-block; background: #000; color: #fff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">View My Orders</a>
                <p style="margin-top: 40px; font-size: 11px; color: #9ca3af; font-weight: 500;">Thank you for shopping with GuraFaster!</p>
              </div>
              `
            );
          }
        } catch (emailError) {
          console.error("Status update email failed:", emailError);
        }
      }

      return res.json(order);
    }

    /* ================= VENDOR ================= */
    if (role === "vendor") {
      // Vendor can only update orders containing their products
      const vendorOwnsItems = order.items.some(
        (item: any) => item.vendorId && item.vendorId.toString() === userId
      );

      if (!vendorOwnsItems) {
        return res.status(403).json({
          message: "You can only update orders for your products",
        });
      }

      if (!["shipped", "delivered"].includes(status)) {
        return res.status(403).json({
          message: "Vendor can only update status to shipped or delivered",
        });
      }

      const oldStatus = order.status;
      order.status = status;
      await order.save();

      // Notify customer
      if (oldStatus !== status) {
        try {
          const user = await userModel.findById(order.customerId);
          if (user) {
            await sendEmail(
              user.email,
              `Update on your Order #${order.id.split("-")[0].toUpperCase()}`,
              `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px;">
                <h1 style="color: #1a1a1b; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em;">Order Status Updated</h1>
                <p style="color: #4a4a4a; line-height: 1.6;">Hello ${user.firstName},</p>
                <p style="color: #4a4a4a; line-height: 1.6;">Your order <strong>#${order.id.split("-")[0].toUpperCase()}</strong> has been updated to <strong>${status.toUpperCase()}</strong> by the vendor.</p>
                <div style="margin: 30px 0; background: #f8f8f8; padding: 20px; border-radius: 12px; border-left: 4px solid #3b82f6;">
                  <span style="font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">New Status</span>
                  <span style="font-size: 18px; font-weight: 800; color: #3b82f6; text-transform: uppercase;">${status}</span>
                </div>
                <p style="color: #4a4a4a; line-height: 1.6;">Check your details here:</p>
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/orders" style="display: inline-block; background: #000; color: #fff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">View My Orders</a>
              </div>
              `
            );
          }
        } catch (emailError) {
          console.error("Vendor update email failed:", emailError);
        }
      }

      return res.json(order);
    }

    /* ================= CUSTOMER ================= */
    if (role === "customer") {
      // Ensure customerId exists
      if (!order.customerId) {
        return res.status(400).json({ message: "Order has no customerId" });
      }

      // Compare customerId safely
      if (order.customerId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "This is not your order" });
      }

      if (status !== "cancelled") {
        return res.status(403).json({
          message: "Customers can only cancel orders",
        });
      }

      if (order.status !== "pending") {
        return res.status(400).json({
          message: "Only pending orders can be cancelled",
        });
      }

      order.status = "cancelled";
      await order.save();
      return res.json(order);
    }

    return res.status(403).json({ message: "Unauthorized action" });
  } catch (error) {
    console.error("updateOrder error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};



/**
 * DELETE ORDER
 */
/**
 * @swagger
 * /api/orders/deleteOrders/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Order deleted
 *       404:
 *         description: Order not found
 */
export const deleteOrder = async (req: Request, res: Response) => {
  const role = (req as any).role;
  if (role !== "admin") return res.status(403).json({ message: "Admins only" });

  const order = await orderModel.findOneAndDelete({ id: req.params.id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.status(204).send();
};
