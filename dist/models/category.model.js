import mongoose, { Schema } from 'mongoose';
const categorySchema = new Schema({
    id: { type: String, required: [true, "Category ID is required"], unique: true },
    name: { type: String, required: [true, "Category name is required"] },
    description: { type: String }
});
export const categoryModel = mongoose.model('Category', categorySchema);
