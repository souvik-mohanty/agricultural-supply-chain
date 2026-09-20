import { useEffect, useMemo, useState } from 'react';

// Client-side pagination: the backend returns full lists, so paging happens in the browser.
export const usePagination = (items, pageSize = 10) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Filters shrink the list: never stay on a page that no longer exists.
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);

  return { page, setPage, totalPages, pageItems };
};
