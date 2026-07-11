import mongoose, { Schema, Document } from "mongoose";

export interface Settings extends Document {
  freeShippingThreshold: number;
}

const settingsSchema = new Schema<Settings>(
  {
    freeShippingThreshold: { type: Number, default: 120, required: true },
  },
  {
    timestamps: true,
  }
);

export const SettingsModel = mongoose.model<Settings>("Settings", settingsSchema);
