import mongoose, { Schema } from "mongoose";
const settingsSchema = new Schema({
    freeShippingThreshold: { type: Number, default: 120, required: true },
}, {
    timestamps: true,
});
export const SettingsModel = mongoose.model("Settings", settingsSchema);
