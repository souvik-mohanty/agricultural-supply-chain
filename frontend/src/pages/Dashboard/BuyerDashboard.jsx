import React from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useCart, useMyOrders, useRfqs } from '../../hooks/useApiData';
import OrdersTable from '../Orders/OrdersTable';
import RfqTable from '../Rfq/RfqTable';

const count = (query, predicate) => (query.isPending ? '…' : query.isError ? '—' : query.data.filter(predicate).length);

const BuyerDashboard = ({ user }) => {
  const orders = useMyOrders();
  const rfqs = useRfqs();
  const cart = useCart();

  const activeStatuses = ['OPEN', 'QUOTED', 'ACCEPTED'];

  return (
    <>
      <div className="ui-stats">
        <StatCard label="Active quote requests" value={count(rfqs, (r) => activeStatuses.includes(r.status))} to="/rfqs" />
        <StatCard label="Quotes to review" value={count(rfqs, (r) => r.status === 'QUOTED')} hint="Sellers have answered" to="/rfqs" />
        <StatCard label="Accepted, ready to order" value={count(rfqs, (r) => r.status === 'ACCEPTED' && !r.orderId)} to="/rfqs" />
        <StatCard label="Orders awaiting payment" value={count(orders, (o) => o.status === 'PENDING')} to="/orders" />
        <StatCard label="Paid orders" value={count(orders, (o) => o.status === 'PAID')} to="/orders" />
        <StatCard
          label="Items in cart"
          value={cart.isPending ? '…' : cart.isError ? '—' : cart.data.items.length}
          to="/cart"
        />
      </div>

      <section className="pg-section" aria-labelledby="recent-orders">
        <h2 id="recent-orders">Recent orders</h2>
        <QueryBoundary
          query={orders}
          empty={
            <EmptyState
              title="No orders yet"
              message="Browse the marketplace to place your first order."
              action={<Link className="ui-btn primary" to="/products">Browse products</Link>}
            />
          }
        >
          {(list) => <OrdersTable orders={list.slice(0, 5)} />}
        </QueryBoundary>
      </section>

      <section className="pg-section" aria-labelledby="recent-rfqs">
        <h2 id="recent-rfqs">Recent quote requests</h2>
        <QueryBoundary
          query={rfqs}
          empty={
            <EmptyState
              title="No quote requests yet"
              message="Open a product and choose “Request a quote” to ask a seller for a price on a bulk quantity."
              action={<Link className="ui-btn primary" to="/products">Find a product</Link>}
            />
          }
        >
          {(list) => <RfqTable rfqs={list.slice(0, 5)} viewerId={user.id} />}
        </QueryBoundary>
      </section>
    </>
  );
};

export default BuyerDashboard;
