import mongoose, { Schema } from "mongoose";
const orderSchema = new Schema({
    id: { type: String, required: true, unique: true },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
        },
    ],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "shipped", "delivered", "cancelled"],
        default: "pending",
    },
    paymentMethod: {
        type: String,
        enum: ["card", "cod"],
        default: "cod",
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
    },
    paymentDetails: {
        cardType: { type: String },
        last4: { type: String },
        transactionId: { type: String },
    },
}, { timestamps: true });
export const orderModel = mongoose.model("Order", orderSchema);
