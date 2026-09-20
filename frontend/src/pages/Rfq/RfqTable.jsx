import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/format';

// `viewerId` decides which counterparty to show: buyers see the seller and sellers see the buyer.
const RfqTable = ({ rfqs, viewerId }) => (
  <div className="ui-table-wrap">
    <table className="ui-table">
      <caption className="ui-sr-only">Quote requests</caption>
      <thead>
        <tr>
          <th scope="col">Product</th>
          <th scope="col" className="num">
            Quantity
          </th>
          <th scope="col">With</th>
          <th scope="col">Deadline</th>
          <th scope="col">Status</th>
          <th scope="col">
            <span className="ui-sr-only">Open</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rfqs.map((rfq) => (
          <tr key={rfq.id}>
            <td>{rfq.productName}</td>
            <td className="num">
              {rfq.quantity} {rfq.unit}
            </td>
            <td>{rfq.buyerId === viewerId ? rfq.sellerName : rfq.buyerName}</td>
            <td>{formatDate(rfq.deadline)}</td>
            <td>
              <StatusBadge status={rfq.status} />
            </td>
            <td>
              <Link to={`/rfqs/${rfq.id}`}>View</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default RfqTable;
