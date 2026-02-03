import mongoose, { Schema } from "mongoose";
const productSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    categoryId: { type: String, required: true },
    inStock: { type: Boolean, default: true },
    quantity: { type: Number, default: 0 },
    images: { type: [String], default: [] },
    // ===== UPDATED: vendor/admin ownership =====
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true // ===== UPDATED: auditing & sorting =====
});
export const ProductModel = mongoose.model("Product", productSchema);
