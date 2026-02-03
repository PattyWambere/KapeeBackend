export type cartModel = {
    id: string;
    productId:string;
    quantity:number;
};

export type cart = {
    userId: string;
    items:cartModel[];
}

export const carts:cart[]=[];