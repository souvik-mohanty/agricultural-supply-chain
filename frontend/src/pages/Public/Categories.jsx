import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/ui/PageLayout';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useProducts } from '../../hooks/useApiData';

// The backend has no categories endpoint: a category is a text field on each product, so this lists the ones in use.
const Categories = () => {
  const products = useProducts();

  const counts = useMemo(() => {
    const tally = {};
    (products.data ?? []).forEach((p) => {
      if (p.category) tally[p.category] = (tally[p.category] ?? 0) + 1;
    });
    return Object.entries(tally).sort((a, b) => a[0].localeCompare(b[0]));
  }, [products.data]);

  return (
    <PageLayout title="Categories" subtitle="Product categories currently on the marketplace">
      <QueryBoundary
        query={products}
        isEmpty={() => counts.length === 0}
        empty={<EmptyState title="No categories yet" message="Categories appear as farmers list products." />}
      >
        {() => (
          <div className="ui-stats">
            {counts.map(([category, count]) => (
              <Link key={category} className="ui-stat ui-stat-link" to={`/products?category=${encodeURIComponent(category)}`}>
                <span className="ui-stat-label">{count} product{count === 1 ? '' : 's'}</span>
                <span className="ui-stat-value" style={{ fontSize: '1.3rem' }}>{category}</span>
              </Link>
            ))}
          </div>
        )}
      </QueryBoundary>
    </PageLayout>
  );
};

export default Categories;
