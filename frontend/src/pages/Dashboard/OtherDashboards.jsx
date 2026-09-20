import React from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import Notice from '../../components/ui/Notice';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useAllQueries, useArticles, useReadyEntries } from '../../hooks/useApiData';
import { formatDateTime } from '../../lib/format';

export const WarehouseDashboard = () => {
  const ready = useReadyEntries();
  return (
    <>
      <div className="ui-stats">
        <StatCard
          label="Ready for delivery"
          value={ready.isPending ? '…' : ready.isError ? '—' : ready.data.length}
          hint="Crops marked ready"
          to="/warehouse"
        />
      </div>
      <section className="pg-section" aria-labelledby="ready-now">
        <h2 id="ready-now">Ready for delivery</h2>
        <QueryBoundary query={ready} empty={<EmptyState title="Nothing ready yet" message="Mark stored crops as ready from the warehouse page." />}>
          {(list) => (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <caption className="ui-sr-only">Crops ready for delivery</caption>
                <thead>
                  <tr>
                    <th scope="col">Crop</th>
                    <th scope="col">Location</th>
                    <th scope="col" className="num">Quantity</th>
                    <th scope="col">Ready since</th>
                  </tr>
                </thead>
                <tbody>
                  {list.slice(0, 8).map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.cropName}</td>
                      <td>{entry.warehouseLocation}</td>
                      <td className="num">{entry.quantity}</td>
                      <td>{formatDateTime(entry.exitTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryBoundary>
        <p>
          <Link to="/warehouse">Open the warehouse</Link>
        </p>
      </section>
    </>
  );
};

export const AdvisorDashboard = () => {
  const queries = useAllQueries();
  const articles = useArticles();
  return (
    <>
      <div className="ui-stats">
        <StatCard
          label="Questions to answer"
          value={queries.isPending ? '…' : queries.isError ? '—' : queries.data.filter((q) => !q.advisorResponse).length}
          to="/queries"
        />
        <StatCard
          label="Questions answered"
          value={queries.isPending ? '…' : queries.isError ? '—' : queries.data.filter((q) => q.advisorResponse).length}
          to="/queries"
        />
        <StatCard
          label="Articles published"
          value={articles.isPending ? '…' : articles.isError ? '—' : articles.data.length}
          to="/advisory"
        />
      </div>
      <p className="pg-section">
        <Link className="ui-btn primary" to="/queries">Answer farmer questions</Link>{' '}
        <Link className="ui-btn ghost" to="/advisory">Publish an article</Link>
      </p>
    </>
  );
};

export const CarrierDashboard = () => (
  <Notice type="info">
    Shipment tracking is not available yet, so there is nothing to manage here for carriers. You can still browse the{' '}
    <Link to="/products">marketplace</Link> and update your <Link to="/profile">profile</Link>.
  </Notice>
);
