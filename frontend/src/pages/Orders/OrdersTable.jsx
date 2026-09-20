import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatCurrency, formatDateTime, shortOrderId } from '../../lib/format';

const summarize = (items) => items.map((item) => `${item.productName} × ${item.quantity}`).join(', ');

// Orders the caller placed (link to details) or, with `seller`, orders containing the caller's products.
const OrdersTable = ({ orders, seller = false }) => (
  <div className="ui-table-wrap">
    <table className="ui-table">
      <caption className="ui-sr-only">{seller ? 'Orders for my products' : 'My orders'}</caption>
      <thead>
        <tr>
          <th scope="col">Order</th>
          {seller && <th scope="col">Buyer</th>}
          <th scope="col">Items</th>
          <th scope="col" className="num">
            {seller ? 'My subtotal' : 'Amount'}
          </th>
          <th scope="col">Status</th>
          <th scope="col">Placed</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => {
          const id = order.id ?? order.orderId;
          return (
            <tr key={id}>
              <td>{seller ? shortOrderId(id) : <Link to={`/orders/${id}`}>{shortOrderId(id)}</Link>}</td>
              {seller && <td>{order.buyerName}</td>}
              <td>{summarize(order.items)}</td>
              <td className="num">{formatCurrency(seller ? order.subtotal : order.amount)}</td>
              <td>
                <StatusBadge status={order.status} />
              </td>
              <td>{formatDateTime(order.createdAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default OrdersTable;
