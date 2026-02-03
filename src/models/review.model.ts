import mongoose, { Document, Schema } from "mongoose";

export interface Review extends Document {
  id: string;
  productId: string;
  userId: mongoose.Types.ObjectId;
  rating: number;       // e.g., 1-5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<Review>(
  {
    id: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

export const ReviewModel = mongoose.model<Review>("Review", reviewSchema);
