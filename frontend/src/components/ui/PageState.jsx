import React from 'react';
import { getErrorMessage } from '../../lib/errors';

// Loading skeletons. variant: 'rows' (lists, details), 'cards' (product grids), 'table'.
export const LoadingState = ({ label = 'Loading…', variant = 'rows', rows = 4, fullPage = false }) => {
  if (fullPage) {
    return (
      <div className="ui-loading ui-loading-full" role="status" aria-live="polite">
        <div className="ui-spinner" aria-hidden="true" />
        <p>{label}</p>
      </div>
    );
  }
  return (
    <div className={`ui-loading ui-loading-${variant}`} role="status" aria-live="polite">
      <span className="ui-sr-only">{label}</span>
      {Array.from({ length: variant === 'cards' ? 8 : rows }, (_, index) => (
        <div key={index} className={variant === 'cards' ? 'ui-skeleton ui-skeleton-card' : 'ui-skeleton'} aria-hidden="true" />
      ))}
    </div>
  );
};

export const EmptyState = ({ title = 'Nothing here yet', message, action }) => (
  <div className="ui-empty">
    <h2>{title}</h2>
    {message && <p>{message}</p>}
    {action}
  </div>
);

export const ErrorState = ({ error, onRetry, title = 'Unable to load data' }) => (
  <div className="ui-empty ui-empty-error" role="alert">
    <h2>{title}</h2>
    <p>{getErrorMessage(error)}</p>
    {onRetry && (
      <button type="button" className="ui-btn primary" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
);

// Renders the right state for a React Query result: loading skeleton, error with retry, empty, or the data.
export const QueryBoundary = ({ query, empty, isEmpty, variant, rows, children }) => {
  if (query.isPending) {
    return <LoadingState variant={variant} rows={rows} />;
  }
  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }
  const nothing = isEmpty ? isEmpty(query.data) : Array.isArray(query.data) && query.data.length === 0;
  if (nothing) {
    return empty ?? <EmptyState />;
  }
  return children(query.data);
};
