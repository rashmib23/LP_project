import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const bloomClass = (level) => (level ? "bloom-" + level.toLowerCase() : "muted");

export default function History() {
  const [lessons, setLessons] = useState([]);
  const [busy, setBusy] = useState(true);
  const [filter, setFilter] = useState("");

  const refresh = () => {
    setBusy(true);
    api
      .get("/lessons/")
      .then((r) => setLessons(r.data.lessons || []))
      .finally(() => setBusy(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this lesson plan and its analysis?")) return;
    await api.delete(`/lessons/${id}`);
    refresh();
  };

  const filtered = lessons.filter((l) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      (l.title || "").toLowerCase().includes(q) ||
      (l.subject || "").toLowerCase().includes(q) ||
      (l.bloom_level || "").toLowerCase().includes(q) ||
      (l.teaching_strategy || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Library</div>
        <h1>Analysis history</h1>
        <p>
          Every lesson plan you&rsquo;ve uploaded, with the deep-learning classification.
          Open a row to see the full report and recommendations.
        </p>
      </div>

      <div className="card">
        <div className="section-head">
          <h2>{filtered.length} {filtered.length === 1 ? "plan" : "plans"}</h2>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by title, subject, level…"
            style={{ maxWidth: 280 }}
          />
        </div>

        {busy ? (
          <p className="muted">Loading…</p>
        ) : lessons.length === 0 ? (
          <div className="empty">
            <h3>Nothing here yet</h3>
            <p>Upload a lesson plan to start building your library.</p>
            <Link to="/upload"><button>Upload a lesson plan</button></Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="muted">No plans match &ldquo;{filter}&rdquo;.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Bloom&rsquo;s</th>
                <th>Strategy</th>
                <th>Confidence</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.title}</strong></td>
                  <td>{l.subject || <span className="muted">—</span>}</td>
                  <td><span className={`tag ${bloomClass(l.bloom_level)}`}>{l.bloom_level}</span></td>
                  <td><span className="tag muted">{l.teaching_strategy}</span></td>
                  <td className="small muted">
                    {Math.round((l.bloom_confidence || 0) * 100)}% / {Math.round((l.strategy_confidence || 0) * 100)}%
                  </td>
                  <td className="muted">
                    {new Date(l.created_at).toLocaleDateString(undefined, {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link to={`/lessons/${l.id}`}>Open</Link>
                    {" · "}
                    <button
                      className="ghost small"
                      style={{ color: "var(--danger)" }}
                      onClick={() => onDelete(l.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
