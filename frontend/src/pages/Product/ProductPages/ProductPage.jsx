import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../../components/ui/PageLayout';
import ProductCard from '../../../components/ProductCard/ProductCard';
import Pagination from '../../../components/ui/Pagination';
import Notice from '../../../components/ui/Notice';
import { EmptyState, QueryBoundary } from '../../../components/ui/PageState';
import { useAuth } from '../../../auth/useAuth';
import { isBuyerRole } from '../../../auth/roles';
import { usePagination } from '../../../hooks/usePagination';
import { useProducts } from '../../../hooks/useApiData';
import { addToCart } from '../../../service/cartApi';
import { getErrorMessage } from '../../../lib/errors';
import { keys } from '../../../lib/queryKeys';
import { SORTS, filterAndSortProducts, uniqueCategories } from '../../../lib/products';

const PAGE_SIZE = 12;

// The marketplace. Filters live in the URL (?q=&category=&sort=) so a filtered view can be shared or bookmarked.
const ProductPage = () => {
  const { isAuthenticated, role } = useAuth();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const products = useProducts();
  const [feedback, setFeedback] = useState(null); // { type, text }
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  // The text box keeps its own state so typing is never interrupted; the URL follows it (for sharing/bookmarks).
  const [q, setQ] = useState(params.get('q') ?? '');
  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? 'name';

  // Functional update: always builds on the newest URL, so quick successive changes cannot overwrite each other.
  const setParam = (key, value) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  const filtered = useMemo(
    () => filterAndSortProducts(products.data ?? [], { q, category, maxPrice, inStockOnly, sort }),
    [products.data, q, category, maxPrice, inStockOnly, sort],
  );
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, PAGE_SIZE);

  // Filters change the list: start again from page 1.
  useEffect(() => setPage(1), [q, category, maxPrice, inStockOnly, sort, setPage]);

  const add = useMutation({
    mutationFn: (product) => addToCart(product.id, 1),
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: keys.cart });
      setFeedback({ type: 'success', text: `${product.name} was added to your cart.` });
    },
    onError: (error) => setFeedback({ type: 'error', text: getErrorMessage(error, 'Could not add the item to your cart.') }),
  });

  return (
    <PageLayout title="Marketplace" subtitle="Agricultural products listed by farmers">
      <Notice type={feedback?.type}>{feedback?.text}</Notice>

      <form className="ui-toolbar" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="ui-field grow">
          <label htmlFor="mk-search">Search</label>
          <input
            id="mk-search"
            className="ui-input"
            type="search"
            placeholder="Name, category or crop details"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setParam('q', event.target.value);
            }}
          />
        </div>
        <div className="ui-field">
          <label htmlFor="mk-category">Category</label>
          <select id="mk-category" className="ui-input" value={category} onChange={(event) => setParam('category', event.target.value)}>
            <option value="">All categories</option>
            {uniqueCategories(products.data ?? []).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="ui-field">
          <label htmlFor="mk-price">Max price per unit (₹)</label>
          <input
            id="mk-price"
            className="ui-input"
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="Any"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
        </div>
        <div className="ui-field">
          <label htmlFor="mk-sort">Sort by</label>
          <select id="mk-sort" className="ui-input" value={sort} onChange={(event) => setParam('sort', event.target.value)}>
            {Object.entries(SORTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="ui-field ui-check">
          <label htmlFor="mk-stock">
            <input id="mk-stock" type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} /> In stock only
          </label>
        </div>
      </form>

      <QueryBoundary
        query={products}
        variant="cards"
        empty={<EmptyState title="No products listed yet" message="Farmers have not added any products. Please check back soon." />}
      >
        {() =>
          filtered.length === 0 ? (
            <EmptyState
              title="No products match your filters"
              message="Try a different search or clear a filter."
              action={
                <button
                  type="button"
                  className="ui-btn primary"
                  onClick={() => {
                    setParams({}, { replace: true });
                    setQ('');
                    setMaxPrice('');
                    setInStockOnly(false);
                  }}
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <p className="pg-sub" aria-live="polite">
                {filtered.length} product{filtered.length === 1 ? '' : 's'}
              </p>
              <div className="mk-grid">
                {pageItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    loggedIn={isAuthenticated}
                    canOrder={isAuthenticated && isBuyerRole(role)}
                    adding={add.isPending && add.variables?.id === product.id}
                    onAddToCart={(p) => {
                      setFeedback(null);
                      add.mutate(p);
                    }}
                  />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )
        }
      </QueryBoundary>
    </PageLayout>
  );
};

export default ProductPage;
