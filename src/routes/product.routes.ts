import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getTopProducts,
  getLowStockProducts,
  getPriceDistribution,
  uploadProductImage,
  rateProduct
} from "../controllers/product.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { upload } from "../services/cloudinary.service";

const router = Router();

// Public product endpoints
router.get("/products", getProducts);
router.get("/productsById/:id", getProductById);
router.post("/rateProduct/:id", rateProduct);

// Aggregation / stats endpoints (public)
router.get("/products/stats", getProductStats);
router.get("/products/top", getTopProducts);
router.get("/products/low-stock", getLowStockProducts);
router.get("/products/price-distribution", getPriceDistribution);

// Protected product endpoints (admin/vendor)
router.post("/upload-product-image", protect, authorize("admin", "vendor"), upload.array("images", 5), uploadProductImage);
router.post("/createProduct", protect, authorize("admin", "vendor"), upload.array("images", 5), createProduct);
router.put("/updateProduct/:id", protect, authorize("admin", "vendor"), upload.array("images", 5), updateProduct);
router.delete("/deleteProduct/:id", protect, authorize("admin", "vendor"), deleteProduct);

export default router;
