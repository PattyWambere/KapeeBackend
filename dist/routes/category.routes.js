import { Router } from "express";
import { getCategories, getCategoriesById, createCategory, updateCategory, deleteCategory, } from "../controllers/category.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
const router = Router();
// Public routes (no authentication)
router.get("/categories", getCategories);
router.get("/categoriesById/:id", getCategoriesById);
// Protected routes (Admin only)
router.post("/createCategory", protect, authorize("admin"), createCategory);
router.put("/updateCategory/:id", protect, authorize("admin"), updateCategory);
router.delete("/deleteCategory/:id", protect, authorize("admin"), deleteCategory);
export default router;
