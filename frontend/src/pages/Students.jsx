
import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";
import { useDebounce } from "../hooks/useDebounce";
import ConfirmDialog from "../components/ConfirmDialog";
import Icon from "../components/Icons";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import StudentFormModal from "../components/StudentFormModal";
import { STATUS_LABELS, formatDate, initials } from "../utils";

// Column headers that can be sorted: [label, backend field]
const COLUMNS = [
  ["Student", "name"],
  ["Course", "course"],
  ["Age", "age"],
  ["CGPA", "cgpa"],
  ["Status", "status"],
  ["Enrolled", "enrollmentDate"],
];

export default function Students() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  // list state
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // filters / paging / sorting
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 350);
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("id");
  const [direction, setDirection] = useState("desc");

  // dialogs
  const [formStudent, setFormStudent] = useState(undefined); // undefined = closed, null = add, object = edit
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  // READ: fetch one page of students whenever a filter, page or sort changes
  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await api.searchStudents({ search, course, status, page, size, sortBy, direction });
        if (!ignore) setData(result);
      } catch (e) {
        if (!ignore) setError(e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [search, course, status, page, size, sortBy, direction, reloadKey]);

  // course names for the filter dropdown and the form suggestions
  useEffect(() => {
    api.getCourses().then(setCourses).catch(() => setCourses([]));
  }, [reloadKey]);

  function handleSort(field) {
    if (sortBy === field) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setDirection("asc");
    }
    setPage(0);
  }

  function clearFilters() {
    setSearchInput("");
    setCourse("");
    setStatus("");
    setPage(0);
  }

  // DELETE (admin only; the server enforces this too)
  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.deleteStudent(toDelete.id);
      toast.success(`${toDelete.name} was deleted`);
      if (data && data.content.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        refresh();
      }
      setToDelete(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  }

  // EXPORT: downloads a CSV with the current filters and sorting
  async function handleExport() {
    setExporting(true);
    try {
      const blob = await api.exportStudents({ search, course, status, sortBy, direction });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "students.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  }

  function handleSaved() {
    setFormStudent(undefined);
    refresh();
  }

  const filtersActive = Boolean(searchInput || course || status);
  const rows = data ? data.content : [];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Students</h1>
          <p className="muted">
            {data ? `${data.totalElements} ${data.totalElements === 1 ? "student" : "students"}` : "Loading…"}
            {filtersActive ? " match your filters" : " on the roll"}
          </p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn btn-ghost" onClick={handleExport} disabled={exporting}>
            <Icon name="download" size={16} />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setFormStudent(null)}>
            <Icon name="plus" size={16} />
            Add student
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Search by name, email or course"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(0);
            }}
            aria-label="Search students"
          />
        </div>

        <select
          value={course}
          onChange={(e) => {
            setCourse(e.target.value);
            setPage(0);
          }}
          aria-label="Filter by course"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {filtersActive && (
          <button type="button" className="link-btn" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <p className="alert alert-error" role="alert">
          {error}{" "}
          <button type="button" className="link-btn" onClick={refresh}>
            Try again
          </button>
        </p>
      )}

      <div className={`table-card ${loading ? "is-loading" : ""}`}>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                {COLUMNS.map(([label, field]) => (
                  <th key={field} aria-sort={sortBy === field ? (direction === "asc" ? "ascending" : "descending") : "none"}>
                    <button type="button" className="th-btn" onClick={() => handleSort(field)}>
                      {label}
                      {sortBy === field && <Icon name={direction === "asc" ? "sortUp" : "sortDown"} size={14} />}
                    </button>
                  </th>
                ))}
                <th className="col-actions">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data === null && loading
                ? Array.from({ length: 5 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={COLUMNS.length + 1}>
                        <div className="skeleton skeleton-row" />
                      </td>
                    </tr>
                  ))
                : rows.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="person">
                          <span className="avatar">{initials(s.name)}</span>
                          <div>
                            <strong>{s.name}</strong>
                            <span className="muted">{s.email || "No email"}</span>
                          </div>
                        </div>
                      </td>
                      <td>{s.course}</td>
                      <td>{s.age}</td>
                      <td>{s.cgpa != null ? s.cgpa.toFixed(1) : "—"}</td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td>{formatDate(s.enrollmentDate)}</td>
                      <td className="col-actions">
                        <button type="button" className="icon-btn" onClick={() => setFormStudent(s)} aria-label={`Edit ${s.name}`}>
                          <Icon name="edit" />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            className="icon-btn icon-btn-danger"
                            onClick={() => setToDelete(s)}
                            aria-label={`Delete ${s.name}`}
                          >
                            <Icon name="trash" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {data && rows.length === 0 && !loading && (
            <div className="empty empty-inline">
              <h2>{filtersActive ? "No students match these filters" : "No students yet"}</h2>
              <p className="muted">
                {filtersActive ? "Try a different search or clear the filters." : "Add the first student to get started."}
              </p>
              {filtersActive ? (
                <button type="button" className="btn btn-ghost" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setFormStudent(null)}>
                  Add student
                </button>
              )}
            </div>
          )}
        </div>

        {data && data.totalElements > 0 && (
          <Pagination
            page={data.page}
            size={data.size}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            onPage={setPage}
            onSize={(s) => {
              setSize(s);
              setPage(0);
            }}
          />
        )}
      </div>

      {formStudent !== undefined && (
        <StudentFormModal
          student={formStudent}
          courses={courses}
          onClose={() => setFormStudent(undefined)}
          onSaved={handleSaved}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title={`Delete ${toDelete.name}?`}
          message="This removes the student record permanently. It cannot be undone."
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
