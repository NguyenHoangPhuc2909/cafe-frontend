export interface AdminProductFilters {
  keyword?: string;
  categoryId?: number;
  active?: boolean;
  page?: number;
  size?: number;
}

export interface CategoryResponse {
  id: number;
  name: string;
}
import type { ProductResponse } from "./api";
import type { DrinkSize } from "./productSize";


export interface AdminProductInput {
  name: string;
  price: number;
  categoryId: number;
  unit: string;
  productType: "MADE_TO_ORDER" | "PACKAGED";
  sizeEnabled: boolean;
  description?: string | null;
  imageUrl?: string | null;
}

export interface RecipeInput {
  ingredientId: number;
  quantity: number;
  size: DrinkSize;
}

export interface SaveAdminProductRequest {
  product: AdminProductInput;
  recipes: RecipeInput[];
}

export interface IngredientOptionResponse {
  id: number;
  name: string;
  unit: string;
}

export interface AdminProductDetailResponse {
  product: ProductResponse & AdminProductInput;
  recipes: (RecipeInput & { ingredientName: string; unit: string })[];
}
