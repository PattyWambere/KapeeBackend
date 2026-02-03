import { randomUUID } from "node:crypto";
import { categoryModel } from "../models/category.model";
/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management APIs
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           example: "Men's Clothing"
 *         description:
 *           type: string
 *           example: "Men's fashion and apparel"
 *
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Men's Clothing"
 *         description:
 *           type: string
 *           example: "Men's fashion and apparel"
 */
/**
 * GET ALL CATEGORIES
 * GET /api/categories/categories
 */
/**
 * @swagger
 * /api/categories/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     description: Retrieve a list of all product categories
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
export const getCategories = async (_req, res) => {
    const categories = await categoryModel.find();
    res.json(categories);
};
/**
 * GET CATEGORY BY ID
 * GET /api/categories/:id
 */
/**
 * @swagger
 * /api/categories/categoriesById/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     description: Retrieve a single category by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category found
 *       400:
 *         description: Category ID is required
 *       404:
 *         description: Category not found
 */
export const getCategoriesById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: "Category ID is required" });
    }
    const category = await categoryModel.findOne({ id });
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
};
/**
 * CREATE CATEGORY
 * POST /api/categories
 */
/**
 * @swagger
 * /api/categories/createCategory:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     description: Create a new product category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error or duplicate category
 */
export const createCategory = async (req, res) => {
    const { name, description } = req.body;
    if (!name || typeof name !== "string") {
        return res.status(400).json({
            message: "Category name is required and must be a string"
        });
    }
    const nameExists = await categoryModel.exists({
        name: { $regex: new RegExp(`^${name}$`, "i") }
    });
    if (nameExists) {
        return res.status(400).json({
            message: "Category name already exists"
        });
    }
    const newCategory = await categoryModel.create({
        id: randomUUID(),
        name,
        description
    });
    res.status(201).json(newCategory);
};
/**
 * UPDATE CATEGORY
 * PUT /api/categories/updateCategory/:id
 */
/**
 * @swagger
 * /api/categories/updateCategories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     description: Update an existing category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation or duplicate name error
 *       404:
 *         description: Category not found
 */
export const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (name !== undefined && typeof name !== "string") {
        return res.status(400).json({
            message: "Category name must be a string"
        });
    }
    if (name) {
        const duplicate = await categoryModel.exists({
            id: { $ne: id },
            name: { $regex: new RegExp(`^${name}$`, "i") }
        });
        if (duplicate) {
            return res.status(400).json({
                message: "Another category with this name already exists"
            });
        }
    }
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (description !== undefined)
        updateData.description = description;
    const category = await categoryModel.findOneAndUpdate({ id }, updateData, { new: true });
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
};
/**
 * DELETE CATEGORY
 * DELETE /api/categories/deleteCategory/:id
 */
/**
 * @swagger
 * /api/categories/deleteCategory/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     description: Delete a category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
export const deleteCategory = async (req, res) => {
    const { id } = req.params;
    const result = await categoryModel.findOneAndDelete({ id });
    if (!result) {
        return res.status(404).json({ message: "Category not found" });
    }
    res.status(204).send();
};
