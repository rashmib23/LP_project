import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const bloomClass = (level) => (level ? "bloom-" + level.toLowerCase() : "muted");

export default function History() {
  const [lessons, setLessons] = useState([]);
  const [busy, setBusy] = useState(true);
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState("");

  // Standard Email/Inbox style selection state layer
  const [selectedLessonIds, setSelectedLessonIds] = useState([]);

  const refresh = () => {
    setBusy(true);
    api
      .get("/lessons/")
      .then((r) => setLessons(r.data.lessons || []))
      .finally(() => setBusy(false));
    setSelectedLessonIds([]); // Reset selection queue on refresh cycles
  };

  useEffect(() => {
    refresh();
  }, []);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this lesson plan and its analysis?")) return;
    setMsg("");
    await api.delete(`/lessons/${id}`);
    refresh();
  };

  // --- Email Style Multi-Select Checkbox Handlers ---

  const handleSelectAllChange = (e) => {
    if (e.target.checked) {
      setSelectedLessonIds(filtered.map((l) => l.id));
    } else {
      setSelectedLessonIds([]);
    }
  };

  const handleRowCheckboxChange = (id) => {
    setSelectedLessonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulletproof Paced Sequential Multi-Row Removal Engine
  const onDeleteSelectedLessons = async () => {
    if (selectedLessonIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete the ${selectedLessonIds.length} selected lesson plan(s) and their analytics?`)) return;

    setMsg("Clearing queued records sequentially...");
    let successCount = 0;
    let failCount = 0;

    try {
      for (const id of selectedLessonIds) {
        try {
          await api.delete(`/lessons/${id}`);
          successCount++;
        } catch (rowErr) {
          console.error(`Database session lock on lesson ID ${id}:`, rowErr);
          failCount++;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (failCount > 0) {
        setMsg(`Processed batch: Cleared ${successCount} plans. ${failCount} items encountered lock conflicts.`);
      } else {
        setMsg(`Successfully cleared all ${successCount} selected lesson plans completely.`);
      }
      refresh();
    } catch (err) {
      setMsg("Purge batch loop encountered an unexpected runtime exception.");
      refresh();
    }
  };

  const filtered = lessons.filter((l) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      (l.title || "").toLowerCase().includes(q) ||
      (l.bloom_level || "").toLowerCase().includes(q) ||
      (l.teaching_strategy || "").toLowerCase().includes(q)
    );
  });

  const isAllSelected = filtered.length > 0 && selectedLessonIds.length === filtered.length;

  const renderFormattedDate = (dateString) => {
    if (!dateString) return <span className="muted">—</span>;
    const parsedTimestamp = Date.parse(dateString);
    if (isNaN(parsedTimestamp)) {
      return dateString;
    }
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  };

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

      {msg && <div className="alert info" style={{ marginBottom: "20px" }}>{msg}</div>}

      <div className="card">
        <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", paddingBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h2 style={{ margin: 0 }}>{filtered.length} {filtered.length === 1 ? "plan" : "plans"}</h2>
            {selectedLessonIds.length > 0 && (
              <button
                type="button"
                className="danger small"
                onClick={onDeleteSelectedLessons}
                style={{ padding: "6px 14px", fontWeight: "700", animation: "fadeIn 0.2s ease-in-out" }}
              >
                🗑 Delete Selected ({selectedLessonIds.length})
              </button>
            )}
          </div>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by title, level…"
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
                <th style={{ width: "40px", paddingRight: "0" }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAllChange}
                    style={{ width: "16px", height: "16px", cursor: "pointer", display: "block" }}
                  />
                </th>
                <th>Title</th>
                {/* Subject Header Row Removed */}
                <th>Bloom&rsquo;s</th>
                <th>Strategy</th>
                <th>Confidence</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const isRowChecked = selectedLessonIds.includes(l.id);
                return (
                  <tr key={l.id} style={{ backgroundColor: isRowChecked ? "rgba(57, 73, 163, 0.05)" : "transparent", transition: "background-color 0.15s ease" }}>
                    <td style={{ paddingRight: "0" }}>
                      <input
                        type="checkbox"
                        checked={isRowChecked}
                        onChange={() => handleRowCheckboxChange(l.id)}
                        style={{ width: "16px", height: "16px", cursor: "pointer", display: "block" }}
                      />
                    </td>
                    <td><strong>{l.title}</strong></td>
                    {/* Subject Data Cell Removed */}
                    <td><span className={`tag ${bloomClass(l.bloom_level)}`}>{l.bloom_level}</span></td>
                    <td><span className="tag muted">{l.teaching_strategy}</span></td>
                    <td className="small muted">
                      {Math.round((l.bloom_confidence || 0) * 100)}% / {Math.round((l.strategy_confidence || 0) * 100)}%
                    </td>
                    <td className="muted">
                      {renderFormattedDate(l.lesson_date || l.created_at)}
                    </td>
                    <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                      <Link to={`/lessons/${l.id}`}>Open</Link>
                      {" · "}
                      <button
                        className="ghost small"
                        style={{ color: "var(--danger)", padding: "4px 8px" }}
                        onClick={() => onDelete(l.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}