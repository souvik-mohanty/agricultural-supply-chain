import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import Pagination from '../../components/ui/Pagination';
import StatCard from '../../components/ui/StatCard';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { usePagination } from '../../hooks/usePagination';
import { useMyOrders } from '../../hooks/useApiData';
import { formatCurrency, formatDateTime, shortOrderId } from '../../lib/format';

// The backend has no payments endpoint. A payment is an order that reached PAID, so this page is built from those.
const Payments = () => {
  const orders = useMyOrders();
  const [search, setSearch] = useState('');

  const payments = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (orders.data ?? [])
      .filter((order) => order.status === 'PAID')
      .filter(
        (order) =>
          !needle ||
          order.id.toLowerCase().includes(needle) ||
          (order.razorpayOrderId ?? '').toLowerCase().includes(needle) ||
          order.items.some((item) => item.productName.toLowerCase().includes(needle)),
      );
  }, [orders.data, search]);
  const { page, setPage, totalPages, pageItems } = usePagination(payments, 10);

  const total = payments.reduce((sum, order) => sum + order.amount, 0);

  return (
    <PageLayout title="Payments" subtitle="Payments you have made, built from your paid orders">
      <Notice type="info">Only confirmed payments are listed. Orders that are still waiting for payment are under Orders.</Notice>

      <div className="ui-stats" style={{ marginBottom: '1rem' }}>
        <StatCard label="Payments" value={orders.isPending ? '…' : payments.length} />
        <StatCard label="Total paid" value={orders.isPending ? '…' : formatCurrency(total)} />
      </div>

      <div className="ui-toolbar">
        <div className="ui-field grow">
          <label htmlFor="pay-search">Search</label>
          <input id="pay-search" className="ui-input" type="search" placeholder="Order id, payment reference or product" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <QueryBoundary
        query={orders}
        isEmpty={(list) => list.filter((o) => o.status === 'PAID').length === 0}
        empty={<EmptyState title="No payments yet" message="Paid orders show up here." action={<Link className="ui-btn primary" to="/products">Browse products</Link>} />}
      >
        {() =>
          payments.length === 0 ? (
            <EmptyState title="No payments match your search" />
          ) : (
            <>
              <div className="ui-table-wrap">
                <table className="ui-table">
                  <caption className="ui-sr-only">Payments</caption>
                  <thead>
                    <tr>
                      <th scope="col">Order</th>
                      <th scope="col">Items</th>
                      <th scope="col" className="num">Amount</th>
                      <th scope="col">Paid on</th>
                      <th scope="col">Payment reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((order) => (
                      <tr key={order.id}>
                        <td><Link to={`/orders/${order.id}`}>{shortOrderId(order.id)}</Link></td>
                        <td>{order.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}</td>
                        <td className="num">{formatCurrency(order.amount)}</td>
                        <td>{formatDateTime(order.updatedAt)}</td>
                        <td>{order.razorpayOrderId ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )
        }
      </QueryBoundary>
    </PageLayout>
  );
};

export default Payments;
