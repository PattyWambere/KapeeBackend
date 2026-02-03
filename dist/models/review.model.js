import mongoose, { Schema } from "mongoose";
const reviewSchema = new Schema({
    id: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
}, { timestamps: true });
export const ReviewModel = mongoose.model("Review", reviewSchema);
