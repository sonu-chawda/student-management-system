
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import Icon from "../components/Icons";
import StatusBadge from "../components/StatusBadge";
import { GENDER_LABELS, STATUS_LABELS, formatDate, greeting, initials, monthLabel } from "../utils";

const STATUS_COLORS = {
  ACTIVE: "var(--ok)",
  INACTIVE: "var(--warn)",
  GRADUATED: "var(--brand)",
};

const TOOLTIP_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  color: "var(--ink)",
  fontSize: 13,
};

const AXIS_TICK = { fill: "var(--muted)", fontSize: 12 };

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [hello] = useState(() => greeting());

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [statsData, recentData] = await Promise.all([
          api.getStats(),
          api.searchStudents({ page: 0, size: 5, sortBy: "id", direction: "desc" }),
        ]);
        if (!ignore) {
          setStats(statsData);
          setRecent(recentData.content);
        }
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
  }, [reloadKey]);

  if (loading && !stats) {
    return (
      <div className="page">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-strip" />
        <div className="grid-2">
          <div className="skeleton skeleton-panel" />
          <div className="skeleton skeleton-panel" />
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="page">
        <div className="empty">
          <h2>We couldn't load the dashboard</h2>
          <p className="muted">{error}</p>
          <button type="button" className="btn btn-primary" onClick={() => setReloadKey((k) => k + 1)}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const total = stats.totalStudents;
  const activePct = total > 0 ? Math.round((stats.activeStudents / total) * 100) : 0;

  const trend = stats.enrollmentTrend.map((p) => ({ label: monthLabel(p.label), count: p.count }));
  const statusData = stats.statusDistribution.map((p) => ({
    key: p.label,
    label: STATUS_LABELS[p.label] || p.label,
    count: p.count,
  }));
  const maxCourse = Math.max(1, ...stats.courseDistribution.map((c) => c.count));
  const genderTotal = stats.genderDistribution.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>
            {hello}, {user?.username}
          </h1>
          <p className="muted">Here is where the student roll stands today.</p>
        </div>
        <Link className="btn btn-primary" to="/students">
          <Icon name="users" size={16} />
          Manage students
        </Link>
      </header>

      {total === 0 ? (
        <div className="empty">
          <h2>No students yet</h2>
          <p className="muted">Add your first student and the charts will fill in.</p>
          <Link className="btn btn-primary" to="/students">
            Add a student
          </Link>
        </div>
      ) : (
        <>
          <section className="ledger" aria-label="Key numbers">
            <div className="ledger-cell">
              <span className="ledger-label">Total students</span>
              <strong className="ledger-value">{total}</strong>
              <span className="ledger-note">{stats.newThisMonth} enrolled this month</span>
            </div>
            <div className="ledger-cell">
              <span className="ledger-label">Active</span>
              <strong className="ledger-value">{stats.activeStudents}</strong>
              <span className="ledger-note">{activePct}% of all students</span>
            </div>
            <div className="ledger-cell">
              <span className="ledger-label">Courses</span>
              <strong className="ledger-value">{stats.totalCourses}</strong>
              <span className="ledger-note">Average age {stats.averageAge}</span>
            </div>
            <div className="ledger-cell">
              <span className="ledger-label">Average CGPA</span>
              <strong className="ledger-value">{stats.averageCgpa.toFixed(2)}</strong>
              <span className="ledger-note">Out of 10</span>
            </div>
          </section>

          <div className="grid-2">
            <section className="panel">
              <h2>Enrolments, last 6 months</h2>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--line)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--surface-2)" }} />
                    <Bar dataKey="count" name="Enrolled" fill="var(--brand)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="panel">
              <h2>Student status</h2>
              <div className="status-split">
                <div className="donut-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {statusData.map((s) => (
                          <Cell key={s.key} fill={STATUS_COLORS[s.key] || "var(--muted)"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="legend">
                  {statusData.map((s) => (
                    <li key={s.key}>
                      <span className="dot" style={{ background: STATUS_COLORS[s.key] || "var(--muted)" }} />
                      {s.label}
                      <strong>{s.count}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              {genderTotal > 0 && (
                <div className="gender">
                  <div className="gender-bar" role="img" aria-label="Gender split">
                    {stats.genderDistribution.map((g, i) => (
                      <span
                        key={g.label}
                        className={`gender-seg gender-seg-${i % 3}`}
                        style={{ width: `${(g.count / genderTotal) * 100}%` }}
                      />
                    ))}
                  </div>
                  <ul className="gender-legend">
                    {stats.genderDistribution.map((g, i) => (
                      <li key={g.label}>
                        <span className={`dot gender-seg-${i % 3}`} />
                        {GENDER_LABELS[g.label] || g.label} {g.count}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          <div className="grid-2">
            <section className="panel">
              <h2>Students per course</h2>
              <ul className="bars">
                {stats.courseDistribution.map((c) => (
                  <li key={c.label}>
                    <div className="bars-row">
                      <span>{c.label}</span>
                      <strong>{c.count}</strong>
                    </div>
                    <div className="bars-track">
                      <div className="bars-fill" style={{ width: `${(c.count / maxCourse) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Recently added</h2>
                <Link to="/students" className="link-btn">
                  View all
                </Link>
              </div>
              <ul className="recent">
                {recent.map((s) => (
                  <li key={s.id}>
                    <span className="avatar">{initials(s.name)}</span>
                    <div className="recent-meta">
                      <strong>{s.name}</strong>
                      <span className="muted">
                        {s.course} · joined {formatDate(s.enrollmentDate)}
                      </span>
                    </div>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
