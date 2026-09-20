import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useProducts, useRfqs, useSellerOrders } from '../../hooks/useApiData';
import { formatCurrency } from '../../lib/format';
import OrdersTable from '../Orders/OrdersTable';
import RfqTable from '../Rfq/RfqTable';

const SellerDashboard = ({ user }) => {
  const products = useProducts();
  const rfqs = useRfqs();
  const orders = useSellerOrders();

  // The catalogue endpoint returns everyone's products; a farmer's own are the ones with their id.
  const mine = useMemo(() => (products.data ?? []).filter((p) => p.farmerId === user.id), [products.data, user.id]);

  const forMe = (rfq) => rfq.sellerId === user.id;
  const rfqCount = (status) => (rfqs.isPending ? '…' : rfqs.isError ? '—' : rfqs.data.filter((r) => forMe(r) && r.status === status).length);

  const paid = (orders.data ?? []).filter((o) => o.status === 'PAID');
  const revenue = paid.reduce((sum, order) => sum + order.subtotal, 0);
  const pending = (orders.data ?? []).filter((o) => o.status === 'PENDING').length;

  return (
    <>
      <div className="ui-stats">
        <StatCard label="My products" value={products.isPending ? '…' : products.isError ? '—' : mine.length} to="/manage/products" />
        <StatCard
          label="Units in stock"
          value={products.isPending ? '…' : products.isError ? '—' : mine.reduce((sum, p) => sum + p.quantityAvailable, 0)}
        />
        <StatCard label="Quote requests to answer" value={rfqCount('OPEN')} hint="Buyers waiting for a price" to="/rfqs" />
        <StatCard label="Quotes sent" value={rfqCount('QUOTED')} hint="Waiting for the buyer" to="/rfqs" />
        <StatCard label="Accepted quotes" value={rfqCount('ACCEPTED')} to="/rfqs" />
        <StatCard label="Paid orders" value={orders.isPending ? '…' : orders.isError ? '—' : paid.length} to="/orders" />
        <StatCard
          label="Revenue (paid orders)"
          value={orders.isPending ? '…' : orders.isError ? '—' : formatCurrency(revenue)}
          hint={pending > 0 ? `${pending} order${pending === 1 ? '' : 's'} awaiting payment` : undefined}
        />
      </div>

      <section className="pg-section" aria-labelledby="needs-quote">
        <h2 id="needs-quote">Quote requests waiting for you</h2>
        <QueryBoundary
          query={rfqs}
          isEmpty={(list) => list.filter((r) => forMe(r) && r.status === 'OPEN').length === 0}
          empty={<EmptyState title="Nothing waiting" message="New quote requests for your products will show up here." />}
        >
          {(list) => <RfqTable rfqs={list.filter((r) => forMe(r) && r.status === 'OPEN').slice(0, 5)} viewerId={user.id} />}
        </QueryBoundary>
      </section>

      <section className="pg-section" aria-labelledby="seller-orders">
        <h2 id="seller-orders">Recent orders for my products</h2>
        <QueryBoundary
          query={orders}
          empty={
            <EmptyState
              title="No orders yet"
              message="Orders appear here once a buyer orders one of your products."
              action={<Link className="ui-btn primary" to="/manage/products/new">Add a product</Link>}
            />
          }
        >
          {(list) => <OrdersTable orders={list.slice(0, 5)} seller />}
        </QueryBoundary>
      </section>
    </>
  );
};

export default SellerDashboard;
