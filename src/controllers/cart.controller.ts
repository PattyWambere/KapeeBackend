import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { CartModel } from "../models/cart.model";
import { ProductModel } from "../models/product.model";

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "c1a2b3d4"
 *         productId:
 *           type: string
 *           example: "p123"
 *         quantity:
 *           type: number
 *           example: 2
 *         name:
 *           type: string
 *           example: "Basic White Tee"
 *         price:
 *           type: number
 *           example: 25.0
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example: ["https://res.cloudinary.com/demo/image1.jpg"]
 *
 *     Cart:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "u123"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 */

/**
 * GET USER CART
 */
/**
 * @swagger
 * /api/cart/cartItems:
 *   get:
 *     summary: Get logged-in user's cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User cart retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized
 */
export const getCart = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const cart = await CartModel.findOne({ userId });
  if (!cart) {
    return res.json({ userId, items: [] });
  }

  // Populate product details manually
  const populatedItems = await Promise.all(
    cart.items.map(async (item) => {
      const product = await ProductModel.findOne({ id: item.productId });
      return {
        ...(item as any).toObject(),
        name: product?.name || "Unknown Product",
        price: product?.price || 0,
        images: product?.images || []
      };
    })
  );

  res.json({ userId, items: populatedItems });
};

/**
 * ADD ITEM TO CART
 */
/**
 * @swagger
 * /api/cart/addCartItem/items:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "p123"
 *               quantity:
 *                 type: number
 *                 example: 2
 *     responses:
 *       201:
 *         description: Item added to cart
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 */
export const addItem = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { productId, quantity } = req.body;

  if (!productId || typeof productId !== "string") {
    return res.status(400).json({ message: "productId is required" });
  }

  if (typeof quantity !== "number" || quantity <= 0) {
    return res.status(400).json({
      message: "Quantity must be a number greater than 0"
    });
  }

  const product = await ProductModel.findOne({ id: productId });
  if (!product) return res.status(404).json({ message: "Product not found" });

  if (!product.inStock || product.quantity < quantity) {
    return res.status(400).json({ message: "Not enough stock available" });
  }

  let cart = await CartModel.findOne({ userId });
  if (!cart) cart = await CartModel.create({ userId, items: [] });

  const existingItem = cart.items.find(i => i.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
    await cart.save();
    return res.json(existingItem);
  }

  const newItem = { id: randomUUID(), productId, quantity };
  cart.items.push(newItem);
  await cart.save();

  res.status(201).json(newItem);
};

/**
 * UPDATE CART ITEM
 */
/**
 * @swagger
 * /api/cart/updateCartItem/items/{id}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
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
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated
 *       404:
 *         description: Item or cart not found
 */
export const updateItem = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  const { quantity } = req.body;

  if (typeof quantity !== "number" || quantity <= 0) {
    return res.status(400).json({ message: "Quantity must be greater than 0" });
  }

  const cart = await CartModel.findOne({ userId });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.find(i => i.id === id);
  if (!item) return res.status(404).json({ message: "Item not found" });

  const product = await ProductModel.findOne({ id: item.productId });
  if (!product || product.quantity < quantity) {
    return res.status(400).json({ message: "Not enough stock available" });
  }

  item.quantity = quantity;
  await cart.save();
  res.json(item);
};

/**
 * DELETE CART ITEM
 */
/**
 * @swagger
 * /api/cart/deleteCartItem/items/{id}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
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
 *         description: Item removed
 *       404:
 *         description: Item not found
 */
export const deleteItem = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  const cart = await CartModel.findOne({ userId });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const exists = cart.items.some(i => i.id === id);
  if (!exists) return res.status(404).json({ message: "Item not found" });

  cart.items = cart.items.filter(i => i.id !== id);
  await cart.save();

  res.status(204).send();
};

/**
 * CLEAR CART
 */
/**
 * @swagger
 * /api/cart/clearCart:
 *   delete:
 *     summary: Clear user cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       204:
 *         description: Cart cleared
 *       404:
 *         description: Cart not found
 */
export const clearCart = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const cart = await CartModel.findOneAndDelete({ userId });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  res.status(204).send();
};
