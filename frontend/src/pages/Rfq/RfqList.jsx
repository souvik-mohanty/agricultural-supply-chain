import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useAuth } from '../../auth/useAuth';
import { ROLES, isBuyerRole } from '../../auth/roles';
import { usePagination } from '../../hooks/usePagination';
import { useRfqs } from '../../hooks/useApiData';
import RfqTable from './RfqTable';

const TABS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'open', label: 'Waiting for a quote', match: (r) => r.status === 'OPEN' },
  { id: 'quoted', label: 'Quoted', match: (r) => r.status === 'QUOTED' },
  { id: 'accepted', label: 'Accepted', match: (r) => r.status === 'ACCEPTED' },
  { id: 'closed', label: 'Closed', match: (r) => ['REJECTED', 'CANCELLED', 'EXPIRED'].includes(r.status) },
];

const RfqList = () => {
  const { user, role } = useAuth();
  const rfqs = useRfqs();
  const [tab, setTab] = useState('all');

  const filtered = useMemo(() => (rfqs.data ?? []).filter(TABS.find((t) => t.id === tab).match), [rfqs.data, tab]);
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 10);

  const canCreate = isBuyerRole(role) || role === ROLES.ADMIN;

  return (
    <PageLayout
      title="Quote requests"
      subtitle={
        role === ROLES.FARMER
          ? 'Buyers asking you for a price. Answer with a quote.'
          : 'Ask sellers for a price on a bulk quantity, then accept the quote that suits you.'
      }
      actions={canCreate && <Link className="ui-btn primary" to="/rfqs/new">New quote request</Link>}
    >
      <div className="ui-tabs" role="group" aria-label="Filter by status">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="ui-tab"
            aria-pressed={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setPage(1);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <QueryBoundary
        query={rfqs}
        empty={
          <EmptyState
            title="No quote requests yet"
            message={canCreate ? 'Pick a product and request a quote to start.' : 'When a buyer asks for a quote on your products it will show up here.'}
            action={canCreate && <Link className="ui-btn primary" to="/products">Find a product</Link>}
          />
        }
      >
        {() =>
          filtered.length === 0 ? (
            <EmptyState title="Nothing in this view" message="Try another status." />
          ) : (
            <>
              <RfqTable rfqs={pageItems} viewerId={user.id} />
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )
        }
      </QueryBoundary>
    </PageLayout>
  );
};

export default RfqList;
