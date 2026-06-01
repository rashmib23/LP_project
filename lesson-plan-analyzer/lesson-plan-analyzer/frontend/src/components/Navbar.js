import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function initials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand" aria-label="Lesson Plan Analyzer home">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Lesson<em>Lab</em></span>
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/upload">Upload</NavLink>
            <NavLink to="/history">History</NavLink>
            <NavLink to="/performance">Performance</NavLink>
            <span className="nav-user" title={user.email}>
              <span className="avatar">{initials(user.name)}</span>
              <span>{user.name?.split(" ")[0] || "Teacher"}</span>
            </span>
            <button className="ghost small" onClick={onLogout}>Sign out</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Sign in</NavLink>
            <Link to="/register"><button className="small">Create account</button></Link>
          </>
        )}
      </div>
    </nav>
  );
}
