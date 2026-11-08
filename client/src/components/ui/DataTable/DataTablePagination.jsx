import Pagination from '../Pagination/Pagination';

export function DataTablePagination({
  page,
  meta,
  onPageChange,
  limit = 20,
  className = '',
  style,
}) {
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const resolvedLimit = meta?.limit ?? limit;

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
