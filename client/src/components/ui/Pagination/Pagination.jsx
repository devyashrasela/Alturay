import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

const MAX_PAGE_BUTTONS = 5;

// Sliding window of page numbers that always keeps the current page visible,
// so the active page can never fall outside the rendered range.
const getPageWindow = (currentPage, totalPages) => {
  const size = Math.min(MAX_PAGE_BUTTONS, totalPages);
  let start = Math.max(1, currentPage - Math.floor(size / 2));
  const end = Math.min(totalPages, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  const resolvedTotal = Math.max(0, Number(total) || 0);
  const resolvedLimit = Number(limit) > 0 ? Number(limit) : 20;
  // Derive the page count from the real record count so it always matches the data.
  const resolvedTotalPages =
    resolvedTotal > 0
      ? Math.ceil(resolvedTotal / resolvedLimit)
      : Math.max(1, Math.floor(Number(totalPages)) || 1);

  if (resolvedTotalPages <= 1) return null;

  const currentPage = Math.min(Math.max(1, Math.floor(Number(page)) || 1), resolvedTotalPages);
  const start = (currentPage - 1) * resolvedLimit + 1;
  const end = resolvedTotal > 0
    ? Math.min(currentPage * resolvedLimit, resolvedTotal)
    : currentPage * resolvedLimit;
  const pages = getPageWindow(currentPage, resolvedTotalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination__info">
        Showing {start}–{end} of {resolvedTotal}
      </span>
      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p) => (
          <button
            type="button"
            key={p}
            className={`pagination__btn ${p === currentPage ? 'pagination__btn--active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          className="pagination__btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === resolvedTotalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
