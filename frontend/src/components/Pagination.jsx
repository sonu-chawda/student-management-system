import Icon from "./Icons";

const SIZES = [5, 10, 20, 50];

function pageWindow(current, total) {
  // up to 5 page numbers centred around the current page
  const start = Math.max(0, Math.min(current - 2, total - 5));
  const end = Math.min(total, start + 5);
  const pages = [];
  for (let i = start; i < end; i++) pages.push(i);
  return pages;
}

export default function Pagination({ page, size, totalPages, totalElements, onPage, onSize }) {
  const from = totalElements === 0 ? 0 : page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {from}–{to} of {totalElements}
      </span>

      <div className="pagination-controls">
        <label className="page-size">
          Rows
          <select value={size} onChange={(e) => onSize(Number(e.target.value))}>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="icon-btn" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <Icon name="chevronLeft" />
        </button>

        {pageWindow(page, totalPages).map((p) => (
          <button
            key={p}
            type="button"
            className={`page-btn ${p === page ? "active" : ""}`}
            onClick={() => onPage(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p + 1}
          </button>
        ))}

        <button
          type="button"
          className="icon-btn"
          disabled={page >= totalPages - 1}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <Icon name="chevronRight" />
        </button>
      </div>
    </div>
  );
}
