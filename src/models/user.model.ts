import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  role: "admin" | "vendor" | "customer";
  avatar?: string;
}

const userSchema = new Schema<User>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: { type: String },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // 🔐 hide password by default
    },

    // ===== password reset fields =====
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },

    // ===== RBAC role =====
    role: {
      type: String,
      enum: ["admin", "vendor", "customer"],
      default: "customer",
    },
  },
  {
    timestamps: true, // useful for user management
  }
);

export const userModel = mongoose.model<User>("User", userSchema);