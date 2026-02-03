import { Router } from "express";
import {
  register,
  login,
  profile,
  logout,
  forgotPassword,
  resetPassword,
  changePassword
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes (require JWT)
router.get("/profile", protect, profile);
router.post("/change-password", protect, changePassword);
router.post("/logout", protect, logout);

export default router;