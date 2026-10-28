import type { Product } from '../types/product.ts';

export function posMenuCategories(products: Product[]) {
  const counts = new Map<string, number>();
  for (const product of products) {
    if (product.isActive === false) continue;
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }
  return [...counts].map(([label, count]) => ({ label, count, icon: 'local_cafe' }));
}

export function filterPosMenu(products: Product[], category: string | null, query: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
  const keyword = normalize(query.trim());
  return products.filter(product => product.isActive !== false
    && (category === null || product.category === category)
    && normalize(product.name + ' ' + product.description).includes(keyword));
}
