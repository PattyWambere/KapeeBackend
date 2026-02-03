import mongoose, { Schema } from 'mongoose';
const cartTtemSchema = new Schema({
    id: { type: String, required: true },
    productId: { type: String, required: true },
    quantity: { type: Number, required: true }
});
const CartSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    items: { type: [cartTtemSchema], default: [] }
});
export const CartModel = mongoose.model('Cart', CartSchema);
