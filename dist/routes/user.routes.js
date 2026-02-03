import { Router } from "express";
import { getUsers, updateUser, deleteUser, uploadAvatar, // Import new controller
 } from "../controllers/user.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { upload } from "../services/cloudinary.service";
const router = Router();
// User routes
router.post("/upload-avatar", protect, upload.single("avatar"), uploadAvatar);
// Admin-only user management
router.get("/getUsers", protect, authorize("admin"), getUsers);
router.put("/updateUser/:id", protect, authorize("admin"), updateUser);
router.delete("/deleteUser/:id", protect, authorize("admin"), deleteUser);
export default router;
