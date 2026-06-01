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

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      if (!err.response) {
        setError("Cannot reach the backend. Please make sure the API server is running.");
      } else {
        setError(err.response.data?.error || "Registration failed.");
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
          <h2>Start with one lesson plan.<br/>Teach the rest with insight.</h2>
          <p>
            Create a free teacher account and run your first analysis in under a minute.
            No setup, no integrations &mdash; just upload a PDF and read the report.
          </p>

          <div className="auth-points">
            <div className="auth-point">
              <span className="dot" aria-hidden="true" />
              <div>
                <strong>Built around Bloom&rsquo;s Taxonomy</strong>
                <span>Six cognitive levels, six teaching strategies, classified per plan.</span>
              </div>
            </div>
            <div className="auth-point">
              <span className="dot" aria-hidden="true" />
              <div>
                <strong>Actionable feedback</strong>
                <span>Notes you can act on before the next class &mdash; not abstract scores.</span>
              </div>
            </div>
            <div className="auth-point">
              <span className="dot" aria-hidden="true" />
              <div>
                <strong>Private by default</strong>
                <span>Each teacher sees only their own plans and student data.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-foot">Built for educators &middot; Your data stays on your server.</div>
      </aside>

      <section className="auth-form-wrap">
        <div className="auth-form">
          <div className="page-head">
            <div className="eyebrow">Create account</div>
            <h1>Start analyzing</h1>
            <p>Tell us who you are. You can change these details later.</p>
          </div>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
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
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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
              <div className="field-hint">Use at least six characters. Mix in a number or two.</div>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-switch muted">
            Already registered? <Link to="/login">Sign in instead</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
