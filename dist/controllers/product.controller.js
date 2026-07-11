import { randomUUID } from "node:crypto";
import { ProductModel } from "../models/product.model";
import { categoryModel } from "../models/category.model";
/**
 * GET ALL PRODUCTS
 * Public access
 */
/**
 * @swagger
 * /api/products/products:
 *   get:
 *     summary: Get all products
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   description:
 *                     type: string
 *                   categoryId:
 *                     type: string
 *                   inStock:
 *                     type: boolean
 *                   quantity:
 *                     type: number
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of image URLs
 *                   createdBy:
 *                     type: string
 */
export const getProducts = async (req, res) => {
    const { search, category } = req.query;
    const query = {};
    if (category && category !== "All Categories") {
        query.categoryId = category;
    }
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }
    const products = await ProductModel.find(query);
    res.json(products);
};
/**
 * GET PRODUCT BY ID
 * Public access
 */
/**
 * @swagger
 * /api/products/productsById/{id}:
 *   get:
 *     summary: Get a product by ID with reviews and user info
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product with reviews found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 price:
 *                   type: number
 *                 description:
 *                   type: string
 *                 categoryId:
 *                   type: string
 *                 inStock:
 *                   type: boolean
 *                 quantity:
 *                   type: number
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of image URLs
 *                 createdBy:
 *                   type: string
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Product not found
 */
export const getProductById = async (req, res) => {
    const { id } = req.params;
    if (!id)
        return res.status(400).json({ message: "Product ID is required" });
    const product = await ProductModel.findOne({ id });
    if (!product)
        return res.status(404).json({ message: "Product not found" });
    res.json(product);
};
/**
 * CREATE PRODUCT
 * Protected
 * Role: Admin / Vendor
 */
/**
 * @swagger
 * /api/products/createProduct:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               inStock:
 *                 type: boolean
 *               quantity:
 *                 type: number
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *               sizes:
 *                 type: array
 *                 items:
 *                   type: string
 *               rating:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload product images
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (role restriction)
 */
export const createProduct = async (req, res) => {
    const { name, price, description, categoryId, inStock, quantity, colors, sizes, rating } = req.body;
    const uploadedImages = (req.files && Array.isArray(req.files)) ? req.files.map((file) => file.path) : [];
    const existingImages = req.body.images ? (Array.isArray(req.body.images) ? req.body.images : [req.body.images]) : [];
    const images = [...existingImages, ...uploadedImages];
    if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Product name is required" });
    }
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({ message: "Price must be a positive number" });
    }
    if (!categoryId || typeof categoryId !== "string") {
        return res.status(400).json({ message: "categoryId is required" });
    }
    const inStockBool = inStock === "true" || inStock === true;
    const quantityNum = Number(quantity);
    if (quantity !== undefined && (isNaN(quantityNum) || quantityNum < 0)) {
        return res.status(400).json({
            message: "Quantity must be a number greater than or equal to 0"
        });
    }
    // Validate category existence
    const categoryExists = await categoryModel.exists({ id: categoryId });
    if (!categoryExists) {
        return res.status(400).json({
            message: "Invalid categoryId. Category does not exist"
        });
    }
    const colorsArr = colors ? (Array.isArray(colors) ? colors : colors.split(",").map((c) => c.trim())) : [];
    const sizesArr = sizes ? (Array.isArray(sizes) ? sizes : sizes.split(",").map((s) => s.trim())) : [];
    const ratingNum = rating ? Number(rating) : 0;
    const numReviewsNum = req.body.numReviews ? Number(req.body.numReviews) : 0;
    const newProduct = await ProductModel.create({
        id: randomUUID(),
        name,
        price: priceNum,
        description,
        categoryId,
        inStock: inStockBool,
        quantity: quantityNum || 0,
        images,
        colors: colorsArr,
        sizes: sizesArr,
        rating: ratingNum,
        numReviews: numReviewsNum,
        // RBAC: track who created the product (admin or vendor)
        createdBy: req.userId
    });
    res.status(201).json(newProduct);
};
/**
 * UPDATE PRODUCT
 * Protected
 * Role: Admin (all products)
 * Vendor (own products – enforce later with RBAC)
 */
/**
 * @swagger
 * /api/products/updateProduct/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               inStock:
 *                 type: boolean
 *               quantity:
 *                 type: number
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *               sizes:
 *                 type: array
 *                 items:
 *                   type: string
 *               rating:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload product images
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       403:
 *         description: Vendor cannot update another vendor's product
 *       404:
 *         description: Product not found
 */
export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, description, categoryId, inStock, quantity, colors, sizes, rating } = req.body;
    const userId = req.userId;
    const role = req.role;
    let images = undefined;
    const uploadedImages = (req.files && Array.isArray(req.files)) ? req.files.map((file) => file.path) : [];
    const existingImages = req.body.images ? (Array.isArray(req.body.images) ? req.body.images : [req.body.images]) : [];
    if (uploadedImages.length > 0 || req.body.images !== undefined) {
        images = [...existingImages, ...uploadedImages];
    }
    if (name !== undefined && typeof name !== "string") {
        return res.status(400).json({ message: "Invalid product name" });
    }
    const priceNum = price !== undefined ? Number(price) : undefined;
    if (priceNum !== undefined && (isNaN(priceNum) || priceNum <= 0)) {
        return res.status(400).json({ message: "Invalid product price" });
    }
    if (categoryId !== undefined) {
        const categoryExists = await categoryModel.exists({ id: categoryId });
        if (!categoryExists) {
            return res.status(400).json({ message: "Invalid categoryId" });
        }
    }
    const inStockBool = inStock !== undefined ? (inStock === "true" || inStock === true) : undefined;
    const quantityNum = quantity !== undefined ? Number(quantity) : undefined;
    if (quantityNum !== undefined && (isNaN(quantityNum) || quantityNum < 0)) {
        return res.status(400).json({ message: "Invalid quantity" });
    }
    const colorsArr = colors ? (Array.isArray(colors) ? colors : colors.split(",").map((c) => c.trim())) : undefined;
    const sizesArr = sizes ? (Array.isArray(sizes) ? sizes : sizes.split(",").map((s) => s.trim())) : undefined;
    const ratingNum = rating !== undefined ? Number(rating) : undefined;
    // Find product to enforce ownership for vendors
    const product = await ProductModel.findOne({ id });
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    // Vendors can only update their own products
    if (role === "vendor" && product.createdBy.toString() !== userId) {
        return res
            .status(403)
            .json({ message: "You can only update your own products" });
    }
    // Apply updates
    product.name = name ?? product.name;
    if (priceNum !== undefined)
        product.price = priceNum;
    product.description = description ?? product.description;
    product.categoryId = categoryId ?? product.categoryId;
    if (inStockBool !== undefined)
        product.inStock = inStockBool;
    if (quantityNum !== undefined)
        product.quantity = quantityNum;
    if (images !== undefined)
        product.images = images;
    if (colorsArr !== undefined)
        product.colors = colorsArr;
    if (sizesArr !== undefined)
        product.sizes = sizesArr;
    if (ratingNum !== undefined)
        product.rating = ratingNum;
    await product.save();
    res.json(product);
};
/**
 * DELETE PRODUCT
 * Protected
 * Role: Admin / Vendor (own product)
 */
/**
 * @swagger
 * /api/products/deleteProduct/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *       403:
 *         description: Vendor cannot delete another vendor's product
 *       404:
 *         description: Product not found
 */
export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    const role = req.role;
    const product = await ProductModel.findOne({ id });
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    // Vendors can only delete their own products
    if (role === "vendor" && product.createdBy.toString() !== userId) {
        return res
            .status(403)
            .json({ message: "You can only delete your own products" });
    }
    await ProductModel.deleteOne({ id });
    res.status(204).send();
};
/**
 * @swagger
 * /api/products/products/stats:
 *   get:
 *     summary: Get product statistics per category (total, avg, min, max price)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Aggregated stats by category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   categoryId:
 *                     type: string
 *                   totalProducts:
 *                     type: number
 *                   avgPrice:
 *                     type: number
 *                   minPrice:
 *                     type: number
 *                   maxPrice:
 *                     type: number
 */
export const getProductStats = async (_req, res) => {
    const stats = await ProductModel.aggregate([
        {
            $group: {
                _id: "$categoryId",
                totalProducts: { $sum: 1 },
                avgPrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" }
            }
        },
        {
            $project: {
                _id: 0,
                categoryId: "$_id",
                totalProducts: 1,
                avgPrice: { $round: ["$avgPrice", 2] },
                minPrice: 1,
                maxPrice: 1
            }
        }
    ]);
    res.json(stats);
};
/**
 * @swagger
 * /api/products/products/top:
 *   get:
 *     summary: Get top 10 most expensive products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Top products by price
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   categoryId:
 *                     type: string
 */
export const getTopProducts = async (_req, res) => {
    const products = await ProductModel.aggregate([
        { $sort: { price: -1 } },
        { $limit: 10 },
        {
            $project: {
                _id: 0,
                id: 1,
                name: 1,
                price: 1,
                categoryId: 1
            }
        }
    ]);
    res.json(products);
};
/**
 * @swagger
 * /api/products/products/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Maximum quantity to consider as low stock
 *     responses:
 *       200:
 *         description: List of low stock products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   quantity:
 *                     type: number
 *                   categoryId:
 *                     type: string
 */
export const getLowStockProducts = async (req, res) => {
    const limit = Number(req.query.limit) || 5;
    const products = await ProductModel.aggregate([
        {
            $match: {
                quantity: { $lte: limit },
                inStock: true
            }
        },
        {
            $project: {
                _id: 0,
                id: 1,
                name: 1,
                quantity: 1,
                categoryId: 1
            }
        },
        { $sort: { quantity: 1 } }
    ]);
    res.json(products);
};
/**
 * @swagger
 * /api/products/products/price-distribution:
 *   get:
 *     summary: Get product price distribution
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Products grouped by price ranges
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Price range label or "Other"
 *                   count:
 *                     type: number
 *                   products:
 *                     type: array
 *                     items:
 *                       type: string
 */
export const getPriceDistribution = async (_req, res) => {
    const distribution = await ProductModel.aggregate([
        {
            $bucket: {
                groupBy: "$price",
                boundaries: [0, 50, 100, 500, 1000000],
                default: "Other",
                output: {
                    count: { $sum: 1 },
                    products: { $push: "$name" }
                }
            }
        }
    ]);
    res.json(distribution);
};
/**
 * @swagger
 * /api/products/upload-product-image:
 *   post:
 *     summary: Upload product images
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: No files uploaded
 *       401:
 *         description: Unauthorized
 */
export const uploadProductImage = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }
        const imageUrls = req.files.map((file) => file.path);
        res.json({ message: "Images uploaded successfully", images: imageUrls });
    }
    catch (error) {
        console.error("Upload product images error:", error);
        res.status(500).json({ message: "Upload failed" });
    }
};
/**
 * @swagger
 * /api/products/rateProduct/{id}:
 *   post:
 *     summary: Submit a rating for a product
 *     tags: [Products]
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
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 *       404:
 *         description: Product not found
 */
export const rateProduct = async (req, res) => {
    const { id } = req.params;
    const { rating } = req.body;
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ message: "Invalid rating. Must be between 1 and 5." });
    }
    const product = await ProductModel.findOne({ id });
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    const currentNumReviews = product.numReviews || 0;
    const currentRating = product.rating || 0;
    const totalRatingPoints = currentRating * currentNumReviews;
    product.numReviews = currentNumReviews + 1;
    product.rating = (totalRatingPoints + ratingNum) / product.numReviews;
    await product.save();
    res.status(200).json({
        message: "Rating submitted successfully",
        newRating: product.rating,
        numReviews: product.numReviews
    });
};
