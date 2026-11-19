import { useEffect } from 'react';
import Pagination from '../Pagination/Pagination';

export function DataTablePagination({
  page,
  meta,
  onPageChange,
  limit = 20,
  className = '',
  style,
}) {
  const total = Math.max(0, Number(meta?.total) || 0);
  const resolvedLimit = Number(meta?.limit) > 0 ? Number(meta.limit) : limit;

  // Count pages from the records the API actually holds, not from a possibly
  // stale meta.totalPages, so the control never renders phantom pages.
  const totalPages =
    total > 0
      ? Math.ceil(total / resolvedLimit)
      : Math.max(1, Math.floor(Number(meta?.totalPages)) || 1);

  // Keep the active page valid when the result set shrinks (search, delete, filter).
  useEffect(() => {
    if (Number(page) > totalPages) {
      onPageChange?.(totalPages);
    }
  }, [page, totalPages, onPageChange]);

  if (totalPages <= 1) return null;

  return (
    <div className={className} style={{ marginTop: 16, ...style }}>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={resolvedLimit}
        onPageChange={onPageChange}
      />
    </div>
  );
}
