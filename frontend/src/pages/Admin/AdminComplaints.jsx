import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { usePagination } from '../../hooks/usePagination';
import { useComplaints } from '../../hooks/useApiData';
import { resolveComplaint } from '../../service/adminApi';
import { getErrorMessage } from '../../lib/errors';
import { formatDateTime } from '../../lib/format';
import { keys } from '../../lib/queryKeys';

const AdminComplaints = () => {
  const queryClient = useQueryClient();
  const complaints = useComplaints();
  const [view, setView] = useState('open');
  const [notice, setNotice] = useState(null);

  const filtered = useMemo(
    () => (complaints.data ?? []).filter((c) => (view === 'all' ? true : view === 'open' ? !c.resolved : c.resolved)),
    [complaints.data, view],
  );
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 10);

  const resolve = useMutation({
    mutationFn: resolveComplaint,
    onSuccess: () => {
      setNotice({ type: 'success', text: 'Complaint marked as resolved.' });
      queryClient.invalidateQueries({ queryKey: keys.complaints });
    },
    onError: (error) => setNotice({ type: 'error', text: getErrorMessage(error) }),
  });

  return (
    <PageLayout title="Complaints" subtitle="Reports filed by users">
      <Notice type={notice?.type}>{notice?.text}</Notice>
      <div className="ui-tabs" role="group" aria-label="Filter">
        {[['open', 'Open'], ['resolved', 'Resolved'], ['all', 'All']].map(([id, label]) => (
          <button key={id} type="button" className="ui-tab" aria-pressed={view === id} onClick={() => { setView(id); setPage(1); }}>
            {label}
          </button>
        ))}
      </div>

      <QueryBoundary query={complaints} empty={<EmptyState title="No complaints" message="Nobody has filed a complaint yet." />}>
        {() =>
          filtered.length === 0 ? (
            <EmptyState title="Nothing in this view" />
          ) : (
            <>
              <div className="ui-table-wrap">
                <table className="ui-table">
                  <caption className="ui-sr-only">Complaints</caption>
                  <thead>
                    <tr>
                      <th scope="col">Against</th>
                      <th scope="col">Message</th>
                      <th scope="col">Filed by (user id)</th>
                      <th scope="col">Filed</th>
                      <th scope="col">Status</th>
                      <th scope="col"><span className="ui-sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((c) => (
                      <tr key={c.id}>
                        <td>{c.against}</td>
                        <td>{c.message}</td>
                        <td>{c.raisedBy}</td>
                        <td>{formatDateTime(c.createdAt)}</td>
                        <td><StatusBadge status={c.resolved ? 'RESOLVED' : 'OPEN'} /></td>
                        <td>
                          {!c.resolved && (
                            <button type="button" className="ui-btn ghost small" onClick={() => resolve.mutate(c.id)} disabled={resolve.isPending}>
                              Mark resolved
                            </button>
                          )}
                        </td>
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

export default AdminComplaints;
