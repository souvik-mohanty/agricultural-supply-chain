import React from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useComplaints, useProducts, useRfqs, useUsers } from '../../hooks/useApiData';
import { roleLabel } from '../../auth/roles';
import { formatDateTime, humanize } from '../../lib/format';

const tally = (list, keyOf) =>
  list.reduce((counts, item) => {
    const key = keyOf(item) ?? 'UNKNOWN';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

// A plain horizontal bar list: real counts, no chart library needed.
const Bars = ({ counts, label }) => {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, n]) => n), 1);
  return (
    <ul className="ui-bars">
      {entries.map(([key, n]) => (
        <li key={key}>
          <span className="ui-bar-label">{label(key)}</span>
          <span className="ui-bar-track" aria-hidden="true">
            <span className="ui-bar-fill" style={{ width: `${(n / max) * 100}%` }} />
          </span>
          <span className="ui-bar-value">{n}</span>
        </li>
      ))}
    </ul>
  );
};

const AdminDashboard = () => {
  const users = useUsers();
  const products = useProducts();
  const complaints = useComplaints();
  const rfqs = useRfqs();

  const show = (query, compute) => (query.isPending ? '…' : query.isError ? '—' : compute(query.data));

  return (
    <>
      <div className="ui-stats">
        <StatCard label="Users" value={show(users, (l) => l.length)} to="/admin/users" />
        <StatCard label="Suspended users" value={show(users, (l) => l.filter((u) => u.suspended).length)} to="/admin/users" />
        <StatCard label="Products listed" value={show(products, (l) => l.length)} to="/manage/products" />
        <StatCard label="Open complaints" value={show(complaints, (l) => l.filter((c) => !c.resolved).length)} to="/admin/complaints" />
        <StatCard label="Quote requests" value={show(rfqs, (l) => l.length)} to="/rfqs" />
      </div>

      <div className="ui-grid-2 pg-section">
        <section className="ui-card" aria-labelledby="by-role">
          <h2 id="by-role">Users by role</h2>
          <QueryBoundary query={users} empty={<EmptyState title="No users" />}>
            {(list) => <Bars counts={tally(list, (u) => u.role)} label={roleLabel} />}
          </QueryBoundary>
        </section>

        <section className="ui-card" aria-labelledby="by-status">
          <h2 id="by-status">Quote requests by status</h2>
          <QueryBoundary query={rfqs} empty={<EmptyState title="No quote requests yet" />}>
            {(list) => <Bars counts={tally(list, (r) => r.status)} label={humanize} />}
          </QueryBoundary>
        </section>
      </div>

      <section className="pg-section" aria-labelledby="open-complaints">
        <h2 id="open-complaints">Open complaints</h2>
        <QueryBoundary
          query={complaints}
          isEmpty={(list) => list.filter((c) => !c.resolved).length === 0}
          empty={<EmptyState title="No open complaints" />}
        >
          {(list) => (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <caption className="ui-sr-only">Open complaints</caption>
                <thead>
                  <tr>
                    <th scope="col">Against</th>
                    <th scope="col">Message</th>
                    <th scope="col">Filed</th>
                  </tr>
                </thead>
                <tbody>
                  {list
                    .filter((c) => !c.resolved)
                    .slice(0, 5)
                    .map((c) => (
                      <tr key={c.id}>
                        <td>{c.against}</td>
                        <td>{c.message}</td>
                        <td>{formatDateTime(c.createdAt)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryBoundary>
        <p>
          <Link to="/admin/complaints">Review all complaints</Link>
        </p>
      </section>
    </>
  );
};

export default AdminDashboard;
