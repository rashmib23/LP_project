import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Upload from "./components/Upload";
import Results from "./components/Results";
import History from "./components/History";
import Performance from "./components/Performance";
import { useAuth } from "./context/AuthContext";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const location = useLocation();
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/register";

  const routes = (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
      <Route path="/lessons/:id" element={<PrivateRoute><Results /></PrivateRoute>} />
      <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
      <Route path="/performance" element={<PrivateRoute><Performance /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (isAuthRoute) {
    return <>{routes}</>;
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Fixed, Non-Moving Left Navigation Sidebar */}
      <div style={{ 
        width: "260px", 
        minWidth: "260px", 
        height: "100vh",
        background: "linear-gradient(180deg, #141b27 0%, #1c2638 100%)",
        borderRight: "1px solid var(--line)",
        position: "sticky",
        top: 0,
        left: 0,
        zIndex: 100
      }}>
        <Navbar />
      </div>
      
      {/* Independent Vertically Scrolling Workspace Content Panel */}
      <main style={{ 
        flexGrow: 1, 
        height: "100vh",
        padding: "32px 40px", 
        background: "var(--bg)", 
        overflowY: "scroll",
        WebkitOverflowScrolling: "touch"
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {routes}
        </div>
      </main>
    </div>
  );
}