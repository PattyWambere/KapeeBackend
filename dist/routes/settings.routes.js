import express from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
const router = express.Router();
router.get("/", getSettings);
router.put("/", protect, authorize("admin"), updateSettings);
export default router;
