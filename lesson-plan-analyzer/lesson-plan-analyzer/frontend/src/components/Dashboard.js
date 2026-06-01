import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const bloomClass = (level) => {
  if (!level) return "muted";
  return "bloom-" + level.toLowerCase();
};

export default function Dashboard() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/lessons/").then((r) => setLessons(r.data.lessons || [])).catch(() => {}),
      api.get("/performance/analytics").then((r) => setAnalytics(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Teacher";
  const totalLessons = lessons.length;
  const avgPct = analytics?.overall?.average_percentage;
  const passRate = analytics?.overall?.pass_rate;
  const records = analytics?.overall?.count;

  return (
    <>
      <section className="hero">
        <div className="page-head" style={{ marginBottom: 0 }}>
          <div className="eyebrow" style={{ color: "rgba(255,255,255,0.7)" }}>
            Dashboard
          </div>
          <h1>Good to see you, {firstName}.</h1>
          <p>
            Run a fresh analysis, review your past lesson plans, or link student scores
            to see which designs are actually moving outcomes.
          </p>
        </div>
        <div className="actions">
          <Link to="/upload"><span className="btn">Analyze a lesson plan</span></Link>
          <Link to="/performance"><span className="btn secondary">Add student scores</span></Link>
        </div>
      </section>

      <div className="grid four">
        <div className="kpi">
          <div className="label">Lessons analyzed</div>
          <div className="value">{loading ? "—" : totalLessons}</div>
          <div className="sub">{totalLessons === 0 ? "Upload your first plan" : "Across your account"}</div>
        </div>
        <div className="kpi">
          <div className="label">Performance records</div>
          <div className="value">{loading ? "—" : (records ?? 0)}</div>
          <div className="sub">Linked to lesson plans</div>
        </div>
        <div className="kpi">
          <div className="label">Average score</div>
          <div className="value">{avgPct != null ? `${avgPct}%` : "—"}</div>
          <div className="sub">Across all assessments</div>
        </div>
        <div className="kpi">
          <div className="label">Pass rate</div>
          <div className="value">{passRate != null ? `${passRate}%` : "—"}</div>
          <div className="sub">≥ 40% threshold</div>
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <h2>Recent lesson plans</h2>
          {lessons.length > 0 && <Link to="/history" className="small">View all</Link>}
        </div>

        {loading ? (
          <p className="muted">Loading your plans…</p>
        ) : lessons.length === 0 ? (
          <div className="empty">
            <h3>No lesson plans yet</h3>
            <p>Upload a PDF, DOCX, or TXT and get an instant Bloom&rsquo;s + strategy classification.</p>
            <Link to="/upload"><button>Upload a lesson plan</button></Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Bloom&rsquo;s level</th>
                <th>Strategy</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lessons.slice(0, 6).map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.title}</strong></td>
                  <td>{l.subject || <span className="muted">—</span>}</td>
                  <td><span className={`tag ${bloomClass(l.bloom_level)}`}>{l.bloom_level}</span></td>
                  <td><span className="tag muted">{l.teaching_strategy}</span></td>
                  <td className="muted">{new Date(l.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</td>
                  <td><Link to={`/lessons/${l.id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
