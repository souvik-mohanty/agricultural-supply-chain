import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { QueryBoundary } from '../../components/ui/PageState';
import { useOrder } from '../../hooks/useApiData';
import { cancelOrder } from '../../service/orderApi';
import { getErrorMessage } from '../../lib/errors';
import { formatCurrency, formatDateTime } from '../../lib/format';
import { keys } from '../../lib/queryKeys';

// The backend only knows PENDING, PAID and CANCELLED, so the timeline shows exactly those steps.
const Timeline = ({ order }) => (
  <ol className="ui-timeline" aria-label="Order progress">
    <li className="done">
      <strong>Order placed</strong>
      {formatDateTime(order.createdAt)}
    </li>
    {order.status === 'PAID' && (
      <li className="done">
        <strong>Payment received</strong>
        {formatDateTime(order.updatedAt)}
      </li>
    )}
    {order.status === 'PENDING' && (
      <li>
        <strong>Waiting for payment</strong>
        Unpaid orders are cancelled automatically 30 minutes after they were placed, and the stock is released.
      </li>
    )}
    {order.status === 'CANCELLED' && (
      <li className="failed done">
        <strong>Cancelled</strong>
        {formatDateTime(order.updatedAt)}
      </li>
    )}
  </ol>
);

const OrderDetails = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const orderQuery = useOrder(id);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState(null);

  const cancel = useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: () => {
      setConfirming(false);
      setNotice({ type: 'success', text: 'The order was cancelled and the stock released.' });
      queryClient.invalidateQueries({ queryKey: keys.order(id) });
      queryClient.invalidateQueries({ queryKey: keys.orders });
    },
    onError: (error) => {
      setConfirming(false);
      setNotice({ type: 'error', text: getErrorMessage(error) });
    },
  });

  return (
    <PageLayout>
      <p>
        <Link to="/orders">← All orders</Link>
      </p>
      <Notice type={notice?.type}>{notice?.text}</Notice>

      <QueryBoundary query={orderQuery} isEmpty={() => false}>
        {(order) => (
          <>
            <header className="pg-header">
              <div>
                <h1>Order</h1>
                <p className="pg-sub">{order.id}</p>
              </div>
              <StatusBadge status={order.status} />
            </header>

            <div className="ui-grid-2">
              <section className="ui-card" aria-labelledby="order-progress">
                <h2 id="order-progress">Progress</h2>
                <Timeline order={order} />
                {order.status === 'PENDING' && (
                  <p className="pg-actions" style={{ marginTop: '1rem' }}>
                    <button type="button" className="ui-btn danger" onClick={() => setConfirming(true)}>
                      Cancel this order
                    </button>
                  </p>
                )}
              </section>

              <section className="ui-card" aria-labelledby="order-summary">
                <h2 id="order-summary">Summary</h2>
                <dl className="ui-kv">
                  <dt>Total</dt>
                  <dd><strong>{formatCurrency(order.amount)}</strong></dd>
                  <dt>Placed</dt>
                  <dd>{formatDateTime(order.createdAt)}</dd>
                  <dt>Payment reference</dt>
                  <dd>{order.razorpayOrderId ?? '—'}</dd>
                </dl>
              </section>
            </div>

            <section className="pg-section" aria-labelledby="order-items">
              <h2 id="order-items">Items</h2>
              <div className="ui-table-wrap">
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col" className="num">Unit price</th>
                      <th scope="col" className="num">Quantity</th>
                      <th scope="col" className="num">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.productId}>
                        <td><Link to={`/products/${item.productId}`}>{item.productName}</Link></td>
                        <td className="num">{formatCurrency(item.unitPrice)}</td>
                        <td className="num">{item.quantity}</td>
                        <td className="num">{formatCurrency(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <ConfirmDialog
              open={confirming}
              title="Cancel this order?"
              confirmLabel="Cancel order"
              danger
              busy={cancel.isPending}
              onConfirm={() => cancel.mutate()}
              onCancel={() => setConfirming(false)}
            >
              The reserved stock is released and the order cannot be paid afterwards.
            </ConfirmDialog>
          </>
        )}
      </QueryBoundary>
    </PageLayout>
  );
};

export default OrderDetails;
