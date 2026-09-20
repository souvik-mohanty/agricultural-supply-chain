import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useInbox } from '../../hooks/useApiData';
import { markAllNotificationsRead, markNotificationRead } from '../../service/notificationApi';
import { getErrorMessage } from '../../lib/errors';
import { formatDateTime } from '../../lib/format';
import { keys } from '../../lib/queryKeys';

const Notifications = () => {
  const queryClient = useQueryClient();
  const inbox = useInbox();
  const [error, setError] = useState(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: keys.inbox });
    queryClient.invalidateQueries({ queryKey: keys.unread });
  };
  const failed = (e) => setError(getErrorMessage(e));

  const markOne = useMutation({ mutationFn: markNotificationRead, onSuccess: refresh, onError: failed });
  const markAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: refresh, onError: failed });

  const unread = (inbox.data ?? []).filter((n) => !n.read).length;

  return (
    <PageLayout
      title="Notifications"
      subtitle={inbox.data ? `${unread} unread` : undefined}
      actions={
        <button type="button" className="ui-btn ghost" onClick={() => markAll.mutate()} disabled={unread === 0 || markAll.isPending}>
          Mark all as read
        </button>
      }
    >
      <Notice type="error">{error}</Notice>
      <QueryBoundary
        query={inbox}
        empty={<EmptyState title="No notifications yet" message="Quote requests, quotes and payments will be announced here." />}
      >
        {(list) => (
          <ul className="nt-list">
            {list.map((n) => (
              <li key={n.id} className={`ui-card nt-item${n.read ? '' : ' unread'}`}>
                <div>
                  <h2>
                    {!n.read && <span className="nt-dot" aria-label="Unread" />}
                    {n.subject}
                  </h2>
                  <p>{n.message}</p>
                  <small className="mk-meta">{formatDateTime(n.timestamp)}</small>
                </div>
                {!n.read && (
                  <button type="button" className="ui-btn ghost small" onClick={() => markOne.mutate(n.id)} disabled={markOne.isPending}>
                    Mark as read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </PageLayout>
  );
};

export default Notifications;
