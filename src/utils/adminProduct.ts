import type { SaveAdminProductRequest } from "../types/adminProduct.ts";

export function recipeConfigurationError({ product, recipes }: SaveAdminProductRequest): string | null {
  if (product.productType === "PACKAGED") {
    return recipes.length ? "Món đóng gói không sử dụng công thức." : null;
  }
  const identities = new Set<string>();
  const sizes = new Set<string>();
  for (const recipe of recipes) {
    if (!Number.isInteger(recipe.ingredientId) || recipe.ingredientId <= 0
        || !Number.isFinite(recipe.quantity) || recipe.quantity <= 0) {
      return "Chọn nguyên liệu và nhập định lượng lớn hơn 0 cho mỗi dòng.";
    }
    const identity = `${recipe.size}:${recipe.ingredientId}`;
    if (identities.has(identity)) return "Một nguyên liệu chỉ xuất hiện một lần trong mỗi size.";
    identities.add(identity);
    sizes.add(recipe.size);
  }
  if (!sizes.has("M") || (product.sizeEnabled && !sizes.has("L"))) {
    return product.sizeEnabled ? "Nhập công thức cho cả size M và L." : "Nhập ít nhất một nguyên liệu cho size M.";
  }
  if ([...sizes].some(size => size !== "M" && (size !== "L" || !product.sizeEnabled))) {
    return "Size công thức không phù hợp với món.";
  }
  return null;
}
