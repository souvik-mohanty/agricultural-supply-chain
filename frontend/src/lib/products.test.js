import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSortProducts, uniqueCategories } from './products.js';

const catalogue = [
  { id: '1', name: 'Tomato', category: 'VEGETABLE', pricePerUnit: 20, quantityAvailable: 100, cropInfo: 'Hybrid, grown in Nashik' },
  { id: '2', name: 'Basmati rice', category: 'GRAIN', pricePerUnit: 90, quantityAvailable: 0, qualityTag: 'Premium' },
  { id: '3', name: 'Onion', category: 'VEGETABLE', pricePerUnit: 15, quantityAvailable: 500 },
  { id: '4', name: 'Wheat', category: 'GRAIN', pricePerUnit: 30, quantityAvailable: 50 },
];
const ids = (list) => list.map((p) => p.id);

test('no filters returns everything, sorted by name', () => {
  assert.deepEqual(ids(filterAndSortProducts(catalogue)), ['2', '3', '1', '4']);
});

test('text search covers name, category, crop info and quality, ignoring case and spaces', () => {
  assert.deepEqual(ids(filterAndSortProducts(catalogue, { q: '  TOMA ' })), ['1']);
  assert.deepEqual(ids(filterAndSortProducts(catalogue, { q: 'grain' })), ['2', '4']);
  assert.deepEqual(ids(filterAndSortProducts(catalogue, { q: 'nashik' })), ['1']);
  assert.deepEqual(ids(filterAndSortProducts(catalogue, { q: 'premium' })), ['2']);
  assert.deepEqual(filterAndSortProducts(catalogue, { q: 'zzz' }), []);
});

test('category, price ceiling and in-stock filters combine', () => {
  assert.deepEqual(ids(filterAndSortProducts(catalogue, { category: 'VEGETABLE' })), ['3', '1']);
  assert.deepEqual(ids(filterAndSortProducts(catalogue, { maxPrice: '30' })), ['3', '1', '4']);
  assert.deepEqual(ids(filterAndSortProducts(catalogue, { inStockOnly: true })), ['3', '1', '4']);
  assert.deepEqual(ids(filterAndSortProducts(catalogue, { category: 'GRAIN', inStockOnly: true, maxPrice: '50' })), ['4']);
});

test('an empty or invalid price ceiling means no limit', () => {
  assert.equal(filterAndSortProducts(catalogue, { maxPrice: '' }).length, 4);
  assert.equal(filterAndSortProducts(catalogue, { maxPrice: 'abc' }).length, 4);
  assert.equal(filterAndSortProducts(catalogue, { maxPrice: '0' }).length, 4);
});

test('sorting', () => {
  assert.deepEqual(ids(filterAndSortProducts(catalogue, { sort: 'priceAsc' })), ['3', '1', '4', '2']);
  assert.deepEqual(ids(filterAndSortProducts(catalogue, { sort: 'priceDesc' })), ['2', '4', '1', '3']);
  assert.deepEqual(ids(filterAndSortProducts(catalogue, { sort: 'stock' })), ['3', '1', '4', '2']);
  assert.deepEqual(ids(filterAndSortProducts(catalogue, { sort: 'bogus' })), ['2', '3', '1', '4']);
});

test('the original list is never mutated', () => {
  const before = ids(catalogue);
  filterAndSortProducts(catalogue, { sort: 'priceDesc' });
  assert.deepEqual(ids(catalogue), before);
});

test('categories are unique and sorted', () => {
  assert.deepEqual(uniqueCategories(catalogue), ['GRAIN', 'VEGETABLE']);
  assert.deepEqual(uniqueCategories([{ category: undefined }, { category: '' }]), []);
});
