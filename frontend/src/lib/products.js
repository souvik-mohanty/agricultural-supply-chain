// Marketplace filtering and sorting. The backend returns the whole catalogue (only ?category= is server-side),
// so search, price, stock and sort run in the browser. Pure functions, unit tested.

export const SORTS = {
  name: 'Name (A to Z)',
  priceAsc: 'Price: low to high',
  priceDesc: 'Price: high to low',
  stock: 'Most available',
};

export const uniqueCategories = (products) =>
  [...new Set(products.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));

const matchesText = (product, query) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [product.name, product.category, product.cropInfo, product.qualityTag].some((field) =>
    (field ?? '').toLowerCase().includes(needle),
  );
};

export const filterAndSortProducts = (products, { q = '', category = '', maxPrice = '', inStockOnly = false, sort = 'name' } = {}) => {
  const ceiling = Number(maxPrice);
  const filtered = products.filter(
    (product) =>
      matchesText(product, q) &&
      (!category || product.category === category) &&
      (!ceiling || product.pricePerUnit <= ceiling) &&
      (!inStockOnly || product.quantityAvailable > 0),
  );

  const compare = {
    name: (a, b) => a.name.localeCompare(b.name),
    priceAsc: (a, b) => a.pricePerUnit - b.pricePerUnit,
    priceDesc: (a, b) => b.pricePerUnit - a.pricePerUnit,
    stock: (a, b) => b.quantityAvailable - a.quantityAvailable,
  }[sort] ?? ((a, b) => a.name.localeCompare(b.name));

  return [...filtered].sort(compare);
};
