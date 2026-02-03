import { Router } from "express";
import { addReview, getProductReviews, getUserReviews } from "../controllers/review.controller";
import { protect } from "../middleware/auth.middleware";
const router = Router();
// Add review (authenticated)
router.post("/reviews", protect, addReview);
// Get reviews for a product (public)
router.get("/products/:productId/reviews", getProductReviews);
// Get reviews by current user (authenticated)
router.get("/users/me/reviews", protect, getUserReviews);
export default router;
