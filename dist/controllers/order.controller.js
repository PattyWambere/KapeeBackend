import { orderModel } from "../models/order.model";
import { v4 as uuidv4 } from "uuid";
import { ProductModel } from "../models/product.model";
import { CartModel } from "../models/cart.model";
import mongoose from "mongoose";
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
export const getOrders = async (_req, res) => {
    const orders = await orderModel.find();
    res.json(orders);
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
export const getOrderById = async (req, res) => {
    const order = await orderModel.findOne({ id: req.params.id });
    if (!order)
        return res.status(404).json({ message: "Order not found" });
    res.json(order);
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
export const createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.userId;
        const cart = await CartModel.findOne({ userId }).session(session);
        if (!cart || cart.items.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Cart is empty" });
        }
        let totalAmount = 0;
        const orderItems = [];
        for (const item of cart.items) {
            const product = await ProductModel.findById(item.productId).session(session);
            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({ message: "Product not found" });
            }
            if (product.quantity < item.quantity) {
                await session.abortTransaction();
                return res.status(400).json({ message: `Not enough stock for ${product.name}` });
            }
            product.quantity -= item.quantity;
            if (product.quantity === 0)
                product.inStock = false;
            await product.save({ session });
            totalAmount += product.price * item.quantity;
            orderItems.push({
                productId: product._id,
                quantity: item.quantity,
                price: product.price,
            });
        }
        const order = await orderModel.create([
            {
                id: uuidv4(),
                customerId: userId,
                items: orderItems,
                totalAmount,
                status: "pending",
            },
        ], { session });
        cart.items = [];
        await cart.save({ session });
        await session.commitTransaction();
        session.endSession();
        return res.status(201).json(order[0]);
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Create order error:", error);
        return res.status(500).json({ message: "Order creation failed" });
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
export const cancelOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.userId;
        const role = req.role;
        const { id } = req.params;
        const order = await orderModel.findOne({ id }).session(session);
        if (!order) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Order not found" });
        }
        if (role === "customer" && order.customerId.toString() !== userId) {
            await session.abortTransaction();
            return res.status(403).json({ message: "Not your order" });
        }
        if (order.status !== "pending") {
            await session.abortTransaction();
            return res.status(400).json({ message: "Only pending orders can be cancelled" });
        }
        for (const item of order.items) {
            const product = await ProductModel.findById(item.productId).session(session);
            if (!product)
                continue;
            product.quantity += item.quantity;
            product.inStock = true;
            await product.save({ session });
        }
        order.status = "cancelled";
        await order.save({ session });
        await session.commitTransaction();
        session.endSession();
        return res.json({ message: "Order cancelled successfully", order });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
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
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.userId;
        const role = req.role;
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
            order.status = status;
            await order.save();
            return res.json(order);
        }
        /* ================= VENDOR ================= */
        if (role === "vendor") {
            // Vendor can only update orders containing their products
            const vendorOwnsItems = order.items.some((item) => item.vendorId && item.vendorId.toString() === userId);
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
            order.status = status;
            await order.save();
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
    }
    catch (error) {
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
export const deleteOrder = async (req, res) => {
    const order = await orderModel.findOneAndDelete({ id: req.params.id });
    if (!order)
        return res.status(404).json({ message: "Order not found" });
    res.status(204).send();
};
