import mongoose, { Schema, Document } from "mongoose";

export interface Product extends Document {
  id: string;
  name: string;
  price: number;
  description?: string;
  categoryId: string;
  inStock: boolean;
  quantity: number;
  images: string[];
  colors: string[];
  sizes: string[];
  rating: number;
  numReviews: number;

  // ===== UPDATED: ownership & RBAC support =====
  createdBy: mongoose.Types.ObjectId; // vendor or admin who created product
}

const productSchema = new Schema<Product>(
  {
    id: { type: String, required: true, unique: true },

    name: { type: String, required: true },

    price: { type: Number, required: true },

    description: { type: String },

    categoryId: { type: String, required: true },

    inStock: { type: Boolean, default: true },

    quantity: { type: Number, default: 0 },

    images: { type: [String], default: [] },

    colors: { type: [String], default: [] },

    sizes: { type: [String], default: [] },

    rating: { type: Number, default: 0 },

    numReviews: { type: Number, default: 0 },

    // ===== UPDATED: vendor/admin ownership =====
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true // ===== UPDATED: auditing & sorting =====
  }
);

export const ProductModel = mongoose.model<Product>(
  "Product",
  productSchema
);