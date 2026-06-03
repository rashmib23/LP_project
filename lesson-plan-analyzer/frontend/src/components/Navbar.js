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
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100%", 
      padding: "28px 18px",
      boxShadow: "inset -1px 0 0 0 rgba(255,255,255,0.05)"
    }}>
      {/* Platform Branding Header */}
      <Link to="/" className="brand" style={{ marginBottom: "36px", padding: "0 8px" }}>
        <span className="brand-mark" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)" }} aria-hidden="true" />
        <span className="brand-name" style={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
          Lesson<em style={{ color: "#38bdf8", fontStyle: "normal", fontWeight: "700" }}>Sphere</em>
        </span>
      </Link>

      {/* Navigation Menu Stack */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexGrow: 1 }} className="sidebar-menu">
        {user ? (
          <>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", margin: "12px 8px 6px" }}>
              Core Space
            </div>
            <NavLink to="/" end style={({ isActive }) => ({
              display: "block",
              color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              borderLeft: isActive ? "3px solid #38bdf8" : "3px solid transparent",
              padding: "10px 12px",
              borderRadius: "0 6px 6px 0",
              textDecoration: "none",
              fontWeight: isActive ? "600" : "400"
            })}>
              Home
            </NavLink>
            
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", margin: "18px 8px 6px" }}>
              Workspace Tools
            </div>
            <NavLink to="/upload" style={({ isActive }) => ({
              display: "block",
              color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              borderLeft: isActive ? "3px solid #0ea5e9" : "3px solid transparent",
              padding: "10px 12px",
              borderRadius: "0 6px 6px 0",
              textDecoration: "none"
            })}>
              Lesson Plan Upload
            </NavLink>
            <NavLink to="/performance" style={({ isActive }) => ({
              display: "block",
              color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              borderLeft: isActive ? "3px solid #0ea5e9" : "3px solid transparent",
              padding: "10px 12px",
              borderRadius: "0 6px 6px 0",
              textDecoration: "none"
            })}>
              Student Performance Anlysis
            </NavLink>
            <NavLink to="/history" style={({ isActive }) => ({
              display: "block",
              color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              borderLeft: isActive ? "3px solid #0ea5e9" : "3px solid transparent",
              padding: "10px 12px",
              borderRadius: "0 6px 6px 0",
              textDecoration: "none"
            })}>
              Analysis History
            </NavLink>
          </>
        ) : (
          <NavLink to="/login" style={{ color: "#fff", padding: "12px" }}>Sign In</NavLink>
        )}
      </div>

      {/* Static Footer Profile Section */}
      {user && (
        <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="nav-user" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", width: "100%", padding: "8px 12px", marginBottom: "10px" }}>
            <span className="avatar" style={{ background: "linear-gradient(135deg, #4f46e5, #0ea5e9)" }}>{initials(user.name)}</span>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.9)" }}>{user.name || "Instructor"}</span>
          </div>
          <button className="ghost small" onClick={onLogout} style={{ color: "#fda4af", width: "100%", textAlign: "left", padding: "8px 12px" }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}