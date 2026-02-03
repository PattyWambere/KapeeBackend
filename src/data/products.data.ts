import { UUID } from "node:crypto";

export type productModel ={
    id:UUID;
    name:string;
    price:number
    description?:string;
    categoryId:string;
    inStock: boolean;
    quantity:number;
}

export const products:productModel[]=[];