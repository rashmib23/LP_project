import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

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

  const firstName = user?.name?.split(" ")[0] || "Professor";

  return (
    <>
      {/* Explicit Project Details Container */}
      <section className="hero" style={{ width: "100%", borderRadius: "12px", padding: "40px", marginBottom: "24px" }}>
        <div className="page-head" style={{ marginBottom: 0 }}>
          <div className="eyebrow" style={{ color: "rgba(255,255,255,0.7)", letterSpacing: "1.5px" }}>Welcome Back, {firstName}</div>
          <h1 style={{ color: "#fff", fontSize: "36px", marginBottom: "12px" }}>LessonSphere</h1>
          <p style={{ marginTop: "14px", fontSize: "15.5px", lineHeight: "1.7", color: "rgba(255,255,255,0.9)", maxWidth: "900px" }}>
            LessonSphere  is an advanced pedagogical intelligence system designed to optimize course engineering and evaluate instructional alignment. By analyzing lesson documentation with semantic classification transformers, the platform bridges structural curriculum design with concrete, data-proven student learning outcomes.
          </p>
        </div>
      </section>

      {/* Embedded Live Metric Analytics Row Section */}
      <h2 style={{ margin: "32px 0 16px 0", fontSize: "20px" }}>Real-time Platform Metrics</h2>
      <div className="grid four" style={{ marginBottom: "32px" }}>
        <div className="kpi">
          <div className="label">Documents Assessed</div>
          <div className="value">{loading ? "—" : lessons.length}</div>
          <div className="sub">Processed Course Profiles</div>
        </div>
        <div className="kpi">
          <div className="label">Outcome Logs Linked</div>
          <div className="value">{loading ? "—" : (analytics?.overall?.count ?? 0)}</div>
          <div className="sub">Individual Scores Mapped</div>
        </div>
        <div className="kpi">
          <div className="label">Class Score Average</div>
          <div className="value">{analytics?.overall?.average_percentage ? `${analytics.overall.average_percentage}%` : "—"}</div>
          <div className="sub">Global Module Performance</div>
        </div>
        <div className="kpi">
          <div className="label">Evaluated Pass Rate</div>
          <div className="value">{analytics?.overall?.pass_rate ? `${analytics.overall.pass_rate}%` : "—"}</div>
          <div className="sub">Passing Criteria Metric Threshold</div>
        </div>
      </div>

      {/* Reconfigured Project Overview Area */}
      <div className="card" style={{ width: "100%", marginBottom: "24px", borderLeft: "4px solid var(--primary)" }}>
        <div className="section-head" style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "16px" }}>
          <h2>Project Overview</h2>
        </div>
        <p style={{ lineHeight: "1.65", color: "var(--ink-soft)", fontSize: "14.5px" }}>
          Modern education frameworks demand absolute tracking between defined curriculum strategies and quantitative student evaluations. However, mapping lesson plans manually is highly subjective, prone to formatting gaps, and completely detached from physical student performance tables. 
        </p>
        <p style={{ lineHeight: "1.65", color: "var(--ink-soft)", marginTop: "12px", fontSize: "14.5px" }}>
          <strong>LessonSphere  addresses this bottleneck by automating systemic validation tasks:</strong> It ingests raw textual files, extracts embedded strategic indicators, breaks down objective clusters, and highlights instructional delivery gaps before a professor steps into the classroom.
        </p>
      </div>

      {/* Refactored High-Effectiveness Workflow Blueprint */}
      <div className="card" style={{ width: "100%", background: "linear-gradient(180deg, #ffffff 0%, var(--surface-2) 100%)" }}>
        <div className="section-head" style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "20px" }}>
          <h2>Application Workflow Architecture</h2>
        </div>
        <div className="grid three" style={{ gap: "24px" }}>
          <div style={{ padding: "24px", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
            <span style={{ fontSize: "11px", fontWeight: "8px", color: "var(--primary)", background: "var(--primary-50)", padding: "4px 10px", borderRadius: "999px", textTransform: "uppercase" }}>Phase 01</span>
            <h3 style={{ color: "var(--ink)", marginTop: "16px", marginBottom: "10px" }}>Structural Parser Ingestion</h3>
            <p className="muted" style={{ fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              Accepts unstructured PDF, DOCX, and plain text files directly. The platform's ingestion pipeline strips document layouts, sanitizes text payloads, maps semantic headings, and detects missing operational segments automatically.
            </p>
          </div>
          <div style={{ padding: "24px", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
            <span style={{ fontSize: "11px", fontWeight: "8px", color: "var(--accent)", background: "var(--accent-50)", padding: "4px 10px", borderRadius: "999px", textTransform: "uppercase" }}>Phase 02</span>
            <h3 style={{ color: "var(--ink)", marginTop: "16px", marginBottom: "10px" }}>Taxonomy Weight Mapping</h3>
            <p className="muted" style={{ fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              A fine-tuned deep classification engine scans text fragments to map target materials precisely across Bloom's Taxonomy cognitive domains (Remembering to Creating) and pedagogical strategy models.
            </p>
          </div>
          <div style={{ padding: "24px", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
            <span style={{ fontSize: "11px", fontWeight: "8px", color: "var(--warn)", background: "var(--warn-50)", padding: "4px 10px", borderRadius: "999px", textTransform: "uppercase" }}>Phase 03</span>
            <h3 style={{ color: "var(--ink)", marginTop: "16px", marginBottom: "10px" }}>Empirical Recommendations</h3>
            <p className="muted" style={{ fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              The engine runs comparison algorithms against your criteria rules to catch lesson plan anomalies. It identifies missing structural components and generates actionable steps to refine text delivery structures.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}