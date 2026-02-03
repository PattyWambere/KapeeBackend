import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: "eklab_users", // Folder in Cloudinary
            allowed_formats: ["jpg", "png", "jpeg", "webp"], // Allowed file types
            public_id: `user-${Date.now()}`, // Unique filename
        };
    },
});

export const upload = multer({ storage: storage });
export { cloudinary };
