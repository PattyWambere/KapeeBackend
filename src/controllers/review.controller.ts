import { Request, Response } from "express";
import { ReviewModel } from "../models/review.model";
import { ProductModel } from "../models/product.model";
import { v4 as uuidv4 } from "uuid";

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product reviews
 */

/**
 * @swagger
 * /api/reviews/reviews:
 *   post:
 *     summary: Add a review for a product
 *     tags: [Reviews]
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
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Invalid input
 */
export const addReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { productId, rating, comment } = req.body;

    // Check product existence
    const product = await ProductModel.findOne({ id: productId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const newReview = await ReviewModel.create({
      id: uuidv4(),
      productId,
      userId,
      rating,
      comment,
    });

    res.status(201).json(newReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * @swagger
 * /api/reviews/products/{productId}/reviews:
 *   get:
 *     summary: Get all reviews for a product (with user info)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews with user info
 */
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const reviews = await ReviewModel.find({ productId }).populate("userId", "id name email");

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * @swagger
 * /api/reviews/users/me/reviews:
 *   get:
 *     summary: Get all reviews by current user (with product info)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of reviews with product info
 */
export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const reviews = await ReviewModel.find({ userId }).populate("productId", "id name price");

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
