import test from 'node:test';
import assert from 'node:assert/strict';
import { paginationItems } from '../src/utils/pagination.ts';

test('pagination shows one page for an empty result and every page for small results', () => {
  assert.deepEqual(paginationItems(0, 0), [1]);
  assert.deepEqual(paginationItems(0, 5), [1, 2, 3, 4, 5]);
});

test('pagination shows the first, current neighbours and last pages with gaps', () => {
  assert.deepEqual(paginationItems(0, 20), [1, 2, 3, 4, 5, 'end-gap', 20]);
  assert.deepEqual(paginationItems(9, 20), [1, 'start-gap', 9, 10, 11, 'end-gap', 20]);
  assert.deepEqual(paginationItems(19, 20), [1, 'start-gap', 16, 17, 18, 19, 20]);
});

test('mobile pagination stays compact and keeps the current and last pages reachable', () => {
  assert.deepEqual(paginationItems(0, 20, true), [1, 2, 3, 'end-gap', 20]);
  assert.deepEqual(paginationItems(9, 20, true), [1, 'start-gap', 10, 'end-gap', 20]);
  assert.deepEqual(paginationItems(19, 20, true), [1, 'start-gap', 18, 19, 20]);
});

test('every pagination window is ordered, bounded, and includes the current page', () => {
  for (const compact of [false, true]) {
    for (let total = 1; total <= 40; total++) {
      for (let page = 0; page < total; page++) {
        const items = paginationItems(page, total, compact);
        const numbers = items.filter((item): item is number => typeof item === 'number');
        assert.ok(items.length <= (compact ? 5 : 7));
        assert.ok(numbers.includes(page + 1));
        assert.equal(numbers[0], 1);
        assert.equal(numbers.at(-1), total);
        assert.deepEqual([...new Set(numbers)].sort((a, b) => a - b), numbers);
      }
    }
  }
});
