import mongoose, { Schema, Document } from 'mongoose';

export interface Category extends Document {
    id: string;
    name: string;
    description?: string;
}


const categorySchema = new Schema<Category>({
    id: { type: String, required: [true, "Category ID is required"], unique: true },
    name: { type: String, required: [true, "Category name is required"] },
    description: { type: String }
});


export const categoryModel = mongoose.model<Category>('Category', categorySchema);