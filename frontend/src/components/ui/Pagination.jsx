import React from 'react';

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <nav className="ui-pagination" aria-label="Pagination">
      <button type="button" className="ui-btn ghost small" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      <span aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <button type="button" className="ui-btn ghost small" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Next
      </button>
    </nav>
  );
};

export default Pagination;
