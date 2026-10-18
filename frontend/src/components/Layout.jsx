import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useTheme } from "../ThemeContext";
import Icon from "./Icons";
import { initials } from "../utils";

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="shell">
      <header className="mobile-bar">
        <button type="button" className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Icon name="menu" size={20} />
        </button>
        <span className="brand-name">Student Management</span>
      </header>

      {menuOpen && <div className="scrim" onClick={closeMenu} />}

      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="sidebar-head">
          <div className="brand">
            <span className="brand-mark">
              <Icon name="cap" size={20} />
            </span>
            <span className="brand-name">Student Management</span>
          </div>
          <button type="button" className="icon-btn sidebar-close" onClick={closeMenu} aria-label="Close menu">
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className="nav" aria-label="Main">
          <NavLink to="/dashboard" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon name="dashboard" />
            Dashboard
          </NavLink>
          <NavLink to="/students" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon name="users" />
            Students
          </NavLink>
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar">{initials(user?.username)}</span>
            <div className="user-meta">
              <strong>{user?.username}</strong>
              <span>{user?.role === "ADMIN" ? "Administrator" : "Staff"}</span>
            </div>
          </div>
          <div className="foot-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={toggleTheme}>
              <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              <Icon name="logout" size={16} />
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
