import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useAuth } from '../../auth/useAuth';
import { ROLES } from '../../auth/roles';
import { usePagination } from '../../hooks/usePagination';
import { useMyOrders, useSellerOrders } from '../../hooks/useApiData';
import OrdersTable from './OrdersTable';

const STATUS_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Awaiting payment' },
  { id: 'PAID', label: 'Paid' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const OrderList = ({ query, seller = false, empty }) => {
  const [status, setStatus] = useState('ALL');
  const filtered = useMemo(
    () => (query.data ?? []).filter((order) => status === 'ALL' || order.status === status),
    [query.data, status],
  );
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 10);

  return (
    <>
      <div className="ui-tabs" role="group" aria-label="Filter by status">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="ui-tab"
            aria-pressed={status === tab.id}
            onClick={() => {
              setStatus(tab.id);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <QueryBoundary query={query} empty={empty}>
        {() =>
          filtered.length === 0 ? (
            <EmptyState title="Nothing in this view" message="Try another status." />
          ) : (
            <>
              <OrdersTable orders={pageItems} seller={seller} />
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )
        }
      </QueryBoundary>
    </>
  );
};

// Orders you placed. Sellers get a second tab with the orders that contain their products.
const MyOrders = () => {
  const { role } = useAuth();
  const isSeller = role === ROLES.FARMER;
  const [view, setView] = useState('placed');
  const placed = useMyOrders();
  const forMyProducts = useSellerOrders(isSeller);

  return (
    <PageLayout title="Orders" subtitle={isSeller ? 'Orders you placed and orders for your products' : 'Orders you placed'}>
      {isSeller && (
        <div className="ui-tabs" role="tablist" aria-label="Which orders">
          <button type="button" role="tab" className="ui-tab" aria-selected={view === 'placed'} onClick={() => setView('placed')}>
            Orders I placed
          </button>
          <button type="button" role="tab" className="ui-tab" aria-selected={view === 'mine'} onClick={() => setView('mine')}>
            Orders for my products
          </button>
        </div>
      )}

      {view === 'placed' || !isSeller ? (
        <OrderList
          query={placed}
          empty={
            <EmptyState
              title="No orders yet"
              message="Orders you place will appear here."
              action={<Link className="ui-btn primary" to="/products">Browse products</Link>}
            />
          }
        />
      ) : (
        <OrderList
          query={forMyProducts}
          seller
          empty={<EmptyState title="No orders for your products yet" message="Orders appear here once a buyer orders one of your products." />}
        />
      )}
    </PageLayout>
  );
};

export default MyOrders;
