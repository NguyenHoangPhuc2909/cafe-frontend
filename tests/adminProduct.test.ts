import test from 'node:test';
import assert from 'node:assert/strict';
import { recipeConfigurationError } from '../src/utils/adminProduct.ts';
import type { SaveAdminProductRequest } from '../src/types/adminProduct.ts';

const request: SaveAdminProductRequest = {
  product: { name: 'Cà phê', price: 30000, categoryId: 1, unit: 'ly', productType: 'MADE_TO_ORDER', sizeEnabled: false },
  recipes: [{ ingredientId: 2, quantity: 20, size: 'M' }],
};

test('single size requires M and enabling M/L requires both recipes', () => {
  assert.equal(recipeConfigurationError(request), null);
  assert.ok(recipeConfigurationError({ ...request, recipes: [] }));
  const sized = { ...request, product: { ...request.product, sizeEnabled: true } };
  assert.ok(recipeConfigurationError(sized));
  assert.equal(recipeConfigurationError({ ...sized, recipes: [...request.recipes, { ingredientId: 2, quantity: 30, size: 'L' }] }), null);
  assert.ok(recipeConfigurationError({ ...request, recipes: [{ ingredientId: 2, quantity: 30, size: 'L' }] }));
});

test('same ingredient can be used across sizes but cannot be duplicated within one size', () => {
  assert.ok(recipeConfigurationError({ ...request, recipes: [...request.recipes, ...request.recipes] }));
});

test('rejects missing ingredients and invalid quantities', () => {
  for (const quantity of [0, -1, NaN, Infinity]) {
    assert.ok(recipeConfigurationError({ ...request, recipes: [{ ...request.recipes[0], quantity }] }));
  }
  assert.ok(recipeConfigurationError({ ...request, recipes: [{ ...request.recipes[0], ingredientId: 0 }] }));
});

test('packaged products require an empty recipe', () => {
  const packaged = { ...request, product: { ...request.product, productType: 'PACKAGED' as const } };
  assert.ok(recipeConfigurationError(packaged));
  assert.equal(recipeConfigurationError({ ...packaged, recipes: [] }), null);
});
