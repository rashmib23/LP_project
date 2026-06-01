import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function EyeIcon({ open }) {
  // Two pure-SVG icons (open eye and slashed eye). No emoji, no font glyphs.
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A10.7 10.7 0 0 1 12 6c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.3 4.2" />
      <path d="M6.6 6.6A17.6 17.6 0 0 0 2 13s3.5 7 10 7a10.7 10.7 0 0 0 5.4-1.5" />
      <path d="M9.9 9.9a3 3 0 1 0 4.2 4.2" />
    </svg>
  );
}

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (!err.response) {
        setError("Cannot reach the backend. Please make sure the API server is running.");
      } else {
        setError(err.response.data?.error || "Login failed.");
      }
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">Lesson<em>Lab</em></span>
        </Link>

        <div className="auth-pitch">
          <h2>Teach with intention.<br/>Analyze with evidence.</h2>
          <p>
            Upload a lesson plan and see exactly where it sits on Bloom&rsquo;s Taxonomy,
            which teaching strategy you&rsquo;re leaning on, and concrete suggestions to
            sharpen the design before you walk into class.
          </p>

          <div className="auth-points">
            <div className="auth-point">
              <span className="dot" aria-hidden="true" />
              <div>
                <strong>Bloom&rsquo;s + strategy classification</strong>
                <span>A trained model labels each plan against the cognitive level and pedagogical approach.</span>
              </div>
            </div>
            <div className="auth-point">
              <span className="dot" aria-hidden="true" />
              <div>
                <strong>Outcome-aware recommendations</strong>
                <span>Targeted notes on objectives, CO/PO mapping, sectional gaps, and assessment alignment.</span>
              </div>
            </div>
            <div className="auth-point">
              <span className="dot" aria-hidden="true" />
              <div>
                <strong>Performance correlation</strong>
                <span>Link student scores to lesson plans and watch which designs actually move outcomes.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-foot">Built for educators &middot; Your data stays on your server.</div>
      </aside>

      <section className="auth-form-wrap">
        <div className="auth-form">
          <div className="page-head">
            <div className="eyebrow">Sign in</div>
            <h1>Welcome back</h1>
            <p>Continue analyzing your plans and tracking outcomes.</p>
          </div>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-affix">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                />
                <button
                  type="button"
                  className="affix-btn"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  aria-pressed={showPwd}
                  title={showPwd ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPwd} />
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="auth-switch muted">
            New here? <Link to="/register">Create a teacher account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
