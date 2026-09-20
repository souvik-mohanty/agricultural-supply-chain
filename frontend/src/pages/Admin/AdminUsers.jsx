import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useAuth } from '../../auth/useAuth';
import { ROLES, roleLabel } from '../../auth/roles';
import { usePagination } from '../../hooks/usePagination';
import { useUsers } from '../../hooks/useApiData';
import { changeUserRole, suspendUser, unsuspendUser } from '../../service/adminApi';
import { getErrorMessage } from '../../lib/errors';
import { keys } from '../../lib/queryKeys';

const AdminUsers = () => {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const users = useUsers();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pending, setPending] = useState(null); // { kind: 'suspend' | 'unsuspend' | 'role', user, role? }
  const [notice, setNotice] = useState(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (users.data ?? [])
      .filter((u) => !needle || u.username.toLowerCase().includes(needle) || (u.email ?? '').toLowerCase().includes(needle))
      .filter((u) => !roleFilter || u.role === roleFilter)
      .filter((u) => !statusFilter || (statusFilter === 'suspended') === u.suspended);
  }, [users.data, search, roleFilter, statusFilter]);
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 10);

  const act = useMutation({
    mutationFn: ({ kind, user, role }) => {
      if (kind === 'suspend') return suspendUser(user.id);
      if (kind === 'unsuspend') return unsuspendUser(user.id);
      return changeUserRole(user.id, role);
    },
    onSuccess: (_, { kind, user, role }) => {
      const text =
        kind === 'suspend' ? `${user.username} was suspended.` : kind === 'unsuspend' ? `${user.username} was reinstated.` : `${user.username} is now ${roleLabel(role)}.`;
      setNotice({ type: 'success', text });
      setPending(null);
      queryClient.invalidateQueries({ queryKey: keys.users });
    },
    onError: (error) => {
      setNotice({ type: 'error', text: getErrorMessage(error) });
      setPending(null);
    },
  });

  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const confirmText = pending
    ? pending.kind === 'suspend'
      ? `${pending.user.username} will not be able to log in, and their current session stops working immediately.`
      : pending.kind === 'unsuspend'
        ? `${pending.user.username} will be able to log in again.`
        : `${pending.user.username} will become ${roleLabel(pending.role)}. This changes what they can do on the platform.`
    : '';

  return (
    <PageLayout title="Users" subtitle="Manage accounts, roles and suspensions">
      <Notice type={notice?.type}>{notice?.text}</Notice>

      <div className="ui-toolbar">
        <div className="ui-field grow">
          <label htmlFor="u-search">Search</label>
          <input id="u-search" className="ui-input" type="search" placeholder="Username or email" value={search} onChange={resetPage(setSearch)} />
        </div>
        <div className="ui-field">
          <label htmlFor="u-role">Role</label>
          <select id="u-role" className="ui-input" value={roleFilter} onChange={resetPage(setRoleFilter)}>
            <option value="">All roles</option>
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r}>{roleLabel(r)}</option>
            ))}
          </select>
        </div>
        <div className="ui-field">
          <label htmlFor="u-status">Status</label>
          <select id="u-status" className="ui-input" value={statusFilter} onChange={resetPage(setStatusFilter)}>
            <option value="">Any</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <QueryBoundary query={users} empty={<EmptyState title="No users" />}>
        {() =>
          filtered.length === 0 ? (
            <EmptyState title="No users match your filters" />
          ) : (
            <>
              <div className="ui-table-wrap">
                <table className="ui-table">
                  <caption className="ui-sr-only">Users</caption>
                  <thead>
                    <tr>
                      <th scope="col">Username</th>
                      <th scope="col">Email</th>
                      <th scope="col">Contact</th>
                      <th scope="col">Role</th>
                      <th scope="col">Status</th>
                      <th scope="col"><span className="ui-sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((u) => {
                      const isMe = u.id === me.id;
                      return (
                        <tr key={u.id}>
                          <td>{u.username}{isMe && ' (you)'}</td>
                          <td>{u.email || '—'}</td>
                          <td>{u.contactNumber || '—'}</td>
                          <td>
                            <label className="ui-sr-only" htmlFor={`role-${u.id}`}>Role of {u.username}</label>
                            <select
                              id={`role-${u.id}`}
                              className="ui-input"
                              value={u.role}
                              disabled={isMe}
                              onChange={(e) => e.target.value !== u.role && setPending({ kind: 'role', user: u, role: e.target.value })}
                            >
                              {Object.values(ROLES).map((r) => (
                                <option key={r} value={r}>{roleLabel(r)}</option>
                              ))}
                            </select>
                          </td>
                          <td><StatusBadge status={u.suspended ? 'SUSPENDED' : 'ACTIVE'} /></td>
                          <td>
                            {!isMe && (
                              <button
                                type="button"
                                className={`ui-btn small ${u.suspended ? 'ghost' : 'danger'}`}
                                onClick={() => setPending({ kind: u.suspended ? 'unsuspend' : 'suspend', user: u })}
                              >
                                {u.suspended ? 'Reinstate' : 'Suspend'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )
        }
      </QueryBoundary>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.kind === 'role' ? 'Change role?' : pending?.kind === 'suspend' ? 'Suspend this user?' : 'Reinstate this user?'}
        confirmLabel={pending?.kind === 'role' ? 'Change role' : pending?.kind === 'suspend' ? 'Suspend' : 'Reinstate'}
        danger={pending?.kind === 'suspend'}
        busy={act.isPending}
        onConfirm={() => act.mutate(pending)}
        onCancel={() => setPending(null)}
      >
        {confirmText}
      </ConfirmDialog>
    </PageLayout>
  );
};

export default AdminUsers;
