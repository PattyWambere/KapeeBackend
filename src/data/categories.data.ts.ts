import { UUID } from "node:crypto";

export type categoryModel = {
    id: UUID;
    name:string;
    description?:string;
}

export const categories:categoryModel[]=[];