import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";

const BLOOM_COLORS = {
  Remember:   "#3949a3",
  Understand: "#0f7c66",
  Apply:      "#b46a00",
  Analyze:    "#7a3a9c",
  Evaluate:   "#b3284c",
  Create:     "#1d4f6b",
};
const FALLBACK = ["#3949a3", "#0f7c66", "#b46a00", "#7a3a9c", "#b3284c", "#1d4f6b"];

const bloomClass = (level) => (level ? "bloom-" + level.toLowerCase() : "muted");

export default function Results() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/lessons/${id}`)
      .then((r) => setLesson(r.data.lesson))
      .catch((err) => setError(err.response?.data?.error || "Failed to load lesson."));
  }, [id]);

  if (error) return <div className="card"><div className="alert error">{error}</div></div>;
  if (!lesson) return <div className="card"><p className="muted">Loading…</p></div>;

  const bloomDist = lesson.analysis?.bloom_distribution || {};
  const stratDist = lesson.analysis?.strategy_distribution || {};

  const bloomChart = Object.entries(bloomDist).map(([k, v]) => ({ name: k, value: +(v * 100).toFixed(2) }));
  const stratChart = Object.entries(stratDist).map(([k, v]) => ({ name: k, value: +(v * 100).toFixed(2) }));

  return (
    <>
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="eyebrow">Lesson report</div>
          <h1 style={{ marginBottom: 4 }}>{lesson.title}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {lesson.subject || "—"}
            {lesson.course_outcome ? ` · CO: ${lesson.course_outcome}` : ""}
            {lesson.program_outcome ? ` · PO: ${lesson.program_outcome}` : ""}
          </p>
        </div>
        <Link to="/history"><button className="secondary">Back to history</button></Link>
      </div>

      <div className="grid three">
        <div className="kpi">
          <div className="label">Bloom&rsquo;s level</div>
          <div className="value" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className={`tag ${bloomClass(lesson.bloom_level)}`} style={{ fontSize: 14, padding: "5px 12px" }}>
              {lesson.bloom_level}
            </span>
          </div>
          <div className="sub">
            Confidence {(lesson.bloom_confidence * 100).toFixed(1)}%
            {lesson.analysis?.model_used?.bloom ? ` · ${lesson.analysis.model_used.bloom}` : ""}
          </div>
        </div>
        <div className="kpi">
          <div className="label">Teaching strategy</div>
          <div className="value">{lesson.teaching_strategy}</div>
          <div className="sub">
            Confidence {(lesson.strategy_confidence * 100).toFixed(1)}%
            {lesson.analysis?.model_used?.strategy ? ` · ${lesson.analysis.model_used.strategy}` : ""}
          </div>
        </div>
        <div className="kpi">
          <div className="label">Higher-order thinking</div>
          <div className="value">{Math.round((lesson.analysis?.higher_order_thinking_share || 0) * 100)}%</div>
          <div className="sub">Apply, Analyze, Evaluate, Create</div>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <div className="section-head"><h2>Bloom&rsquo;s level distribution</h2></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bloomChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ecebe4" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e2dfd6" }} tickLine={false} />
              <YAxis unit="%" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e2dfd6" }} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(57,73,163,0.06)" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {bloomChart.map((d, i) => (
                  <Cell key={i} fill={BLOOM_COLORS[d.name] || FALLBACK[i % FALLBACK.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-head"><h2>Teaching strategy distribution</h2></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stratChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ecebe4" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e2dfd6" }} tickLine={false} />
              <YAxis unit="%" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e2dfd6" }} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(15,124,102,0.06)" }} />
              <Bar dataKey="value" fill="#0f7c66" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="section-head"><h2>Recommendations</h2></div>
        {(!lesson.recommendations || lesson.recommendations.length === 0) ? (
          <p className="muted">No specific recommendations &mdash; this plan looks well-structured.</p>
        ) : (
          lesson.recommendations.map((r, i) => (
            <div key={i} className={`rec ${r.severity}`}>
              <div className="cat">{r.category} &middot; {r.severity}</div>
              <p>{r.suggestion}</p>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="section-head"><h2>Analysis details</h2></div>
        <p className="muted" style={{ marginBottom: 12 }}>
          {lesson.analysis?.word_count} words &middot; {lesson.analysis?.sentence_count} sentences &middot;
          {" "}sections detected: {(lesson.analysis?.sections_detected || []).join(", ") || "—"}
        </p>
        {lesson.analysis?.missing_sections?.length > 0 && (
          <div>
            <span className="tag bad">Missing sections</span>{" "}
            <span className="muted">{lesson.analysis.missing_sections.join(", ")}</span>
          </div>
        )}
      </div>

      {lesson.performance && lesson.performance.length > 0 && (
        <div className="card">
          <div className="section-head"><h2>Linked student performance</h2></div>
          <table>
            <thead>
              <tr><th>Student</th><th>Roll</th><th>Assessment</th><th>Score</th><th>%</th></tr>
            </thead>
            <tbody>
              {lesson.performance.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.student_name}</strong></td>
                  <td className="muted">{p.roll_no}</td>
                  <td>{p.assessment}</td>
                  <td>{p.score} / {p.max_score}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{p.percentage}%</span>
                      <div className="bar" style={{ width: 80 }}>
                        <span style={{ width: `${Math.min(100, p.percentage)}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
