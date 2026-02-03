import mongoose ,{ Schema, Document} from 'mongoose';

export interface cartItem{
    id:string;
    productId:string;
    quantity:number;
}

export interface Cart extends Document {
    userId: string;
    items:cartItem[];
}


const cartTtemSchema = new Schema<cartItem>({
    id: { type: String, required: true },  
    productId: { type: String, required: true },
    quantity: { type: Number, required: true } 
});

const CartSchema = new Schema<Cart>({
    userId: { type: String, required: true, unique: true },
    items: { type: [cartTtemSchema], default: [] }
});

export const CartModel = mongoose.model<Cart>('Cart', CartSchema); 