import React, { useEffect, useState } from "react";
import api from "../api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function Performance() {
  const [lessons, setLessons] = useState([]);
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // Controls for layout switching
  const [inputViewMode, setInputViewMode] = useState("individual"); // individual | csv
  const [showDataLedger, setShowDataLedger] = useState(false); // Hidden by default as requested

  const [form, setForm] = useState({
    lesson_plan_id: "", student_name: "", roll_no: "",
    assessment: "", score: "", max_score: 100, remarks: "",
  });
  const [csv, setCsv] = useState(null);
  const [msg, setMsg] = useState("");
  const [importErrors, setImportErrors] = useState([]);
  const [ignoreInvalidLp, setIgnoreInvalidLp] = useState(true);

  const refresh = () => {
    api.get("/lessons/").then((r) => setLessons(r.data.lessons || []));
    api.get("/performance/").then((r) => setRecords(r.data.records || []));
    api.get("/performance/analytics").then((r) => setAnalytics(r.data));
  };

  useEffect(() => { refresh(); }, []);

  const onAdd = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/performance/", {
        ...form,
        lesson_plan_id: form.lesson_plan_id ? Number(form.lesson_plan_id) : null,
      });
      setMsg("Record added successfully.");
      setForm({
        lesson_plan_id: "", student_name: "", roll_no: "",
        assessment: "", score: "", max_score: 100, remarks: "",
      });
      refresh();
    } catch (err) {
      setMsg(err.response?.data?.error || "Failed to add record.");
    }
  };

  const onCsvUpload = async (e) => {
    e.preventDefault();
    if (!csv) return;
    setImportErrors([]);
    const fd = new FormData();
    fd.append("file", csv);
    if (ignoreInvalidLp) fd.append("ignore_invalid_lesson_id", "1");
    try {
      const r = await api.post("/performance/bulk", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg(`Imported ${r.data.created} record(s) cleanly.`);
      setCsv(null);
      refresh();
    } catch (err) {
      setMsg("Bulk import failed.");
    }
  };

  const byLessonChart = (analytics?.by_lesson || []).map((b) => ({
    name: b.title.length > 18 ? b.title.slice(0, 18) + "…" : b.title,
    avg: b.average_percentage,
    bloom: b.bloom_level,
  }));

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Performance Hub</div>
        <h1>Student Performance Analysis</h1>
        <p>
          Add assessment scores and link them directly to your lesson plans to monitor performance trends.
        </p>
      </div>

      {msg && <div className="alert info">{msg}</div>}

      {/* Styled Operational View Selection Toggles */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", borderBottom: "1px solid var(--line)" }}>
        <button 
          type="button" 
          onClick={() => setInputViewMode("individual")}
          style={{
            background: inputViewMode === "individual" ? "var(--surface)" : "transparent",
            color: inputViewMode === "individual" ? "var(--primary)" : "var(--muted)",
            border: "1px solid " + (inputViewMode === "individual" ? "var(--line)" : "transparent"),
            borderBottom: inputViewMode === "individual" ? "2px solid var(--primary)" : "1px solid transparent",
            borderRadius: "6px 6px 0 0",
            padding: "10px 18px",
            fontSize: "13.5px",
            fontWeight: "600",
            cursor: "pointer",
            transform: "translateY(1px)"
          }}
        >
          Individual Record Entry
        </button>
        <button 
          type="button" 
          onClick={() => setInputViewMode("csv")}
          style={{
            background: inputViewMode === "csv" ? "var(--surface)" : "transparent",
            color: inputViewMode === "csv" ? "var(--primary)" : "var(--muted)",
            border: "1px solid " + (inputViewMode === "csv" ? "var(--line)" : "transparent"),
            borderBottom: inputViewMode === "csv" ? "2px solid var(--primary)" : "1px solid transparent",
            borderRadius: "6px 6px 0 0",
            padding: "10px 18px",
            fontSize: "13.5px",
            fontWeight: "600",
            cursor: "pointer",
            transform: "translateY(1px)"
          }}
        >
          Bulk Import CSV
        </button>
      </div>

      {/* Data Intake Block Configuration Form Panel */}
      <div className="card" style={{ width: "100%" }}>
        {inputViewMode === "individual" ? (
          <form onSubmit={onAdd}>
            <div className="section-head"><h2>Add Single Performance Entry</h2></div>
            <div className="form-row">
              <div>
                <label>Linked Lesson Plan (Optional)</label>
                <select value={form.lesson_plan_id} onChange={(e) => setForm({ ...form, lesson_plan_id: e.target.value })}>
                  <option value="">— None —</option>
                  {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <label>Assessment Name</label>
                <input type="text" value={form.assessment} onChange={(e) => setForm({ ...form, assessment: e.target.value })} placeholder="Quiz 1, Midterm Exam..." required />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Student Full Name</label>
                <input type="text" value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} placeholder="Aarav Kumar" required />
              </div>
              <div>
                <label>Roll Number Reference</label>
                <input type="text" value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} placeholder="21CS001" required />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Earned Score</label>
                <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} required />
              </div>
              <div>
                <label>Maximum Out of Score</label>
                <input type="number" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional progress comments" />
            </div>
            <button type="submit">Commit Score Entry</button>
          </form>
        ) : (
          <form onSubmit={onCsvUpload}>
            <div className="section-head"><h2>Batch Import Document Sheet</h2></div>
            <div className="form-group">
              <label>Choose CSV Target File</label>
              <input type="file" accept=".csv" onChange={(e) => setCsv(e.target.files?.[0] || null)} required />
            </div>
            <div className="form-group">
              <label htmlFor="ignore-lp" style={{ display: "flex", gap: "8px", cursor: "pointer", alignItems: "center" }}>
                <input id="ignore-lp" type="checkbox" checked={ignoreInvalidLp} onChange={(e) => setIgnoreInvalidLp(e.target.checked)} style={{ width: "auto" }} />
                <span className="small">Save missing plan rows as unlinked items safely</span>
              </label>
            </div>
            <button type="submit" disabled={!csv}>Process Data Sheet Ingestion</button>
          </form>
        )}
      </div>

      {/* Fully Functional Outcome Analytics Block Grid & Performance Graph */}
      {analytics?.overall?.count > 0 && (
        <div className="card" style={{ width: "100%", marginTop: "24px" }}>
          <div className="section-head"><h2>Outcome Analytics Evaluation</h2></div>
          <div className="grid three" style={{ marginBottom: "24px" }}>
            <div className="kpi">
              <div className="label">Total Managed Records</div>
              <div className="value">{analytics.overall.count}</div>
            </div>
            <div className="kpi">
              <div className="label">Cumulative Core Average</div>
              <div className="value">{analytics.overall.average_percentage}%</div>
            </div>
            <div className="kpi">
              <div className="label">Evaluated Pass Rate</div>
              <div className="value">{analytics.overall.pass_rate}%</div>
            </div>
          </div>
          
          <h3 style={{ margin: "20px 0 12px 0" }}>Average Score Per Lesson Configuration Plan</h3>
          <div style={{ width: "100%", height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byLessonChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ecebe4" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} />
                <Tooltip formatter={(v, _, p) => [`${v}%`, `Avg (${p.payload.bloom || "—"})`]} />
                <Bar dataKey="avg" fill="#3949a3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Structured Toggle-Ready Bottom Student Grade Grid View Container */}
      <div style={{ marginTop: "24px", marginBottom: "40px" }}>
        <button 
          type="button" 
          onClick={() => setShowDataLedger(!showDataLedger)}
          style={{ 
            width: "100%", 
            padding: "14px 20px", 
            background: "var(--surface)", 
            color: "var(--ink-soft)",
            border: "1px dashed var(--line-strong)", 
            borderRadius: "10px",
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            boxShadow: "var(--shadow-sm)",
            cursor: "pointer"
          }} 
        >
          <span style={{ fontWeight: "700", color: "var(--primary)" }}>
            {showDataLedger ? "Hide Logged Student Records Database ↑" : "Show Logged Student Records Database ↓"}
          </span>
          <span className="tag muted">{records.length} Entries Stored</span>
        </button>

        {showDataLedger && (
          <div className="card" style={{ width: "100%", marginTop: "14px" }}>
            <div className="section-head"><h2>All Active Storage Student Records</h2></div>
            {records.length === 0 ? (
              <p className="muted">No tracking profiles loaded inside system workspace parameters.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Ref</th>
                    <th>Assessment Task</th>
                    <th>Lesson Reference Link</th>
                    <th>Raw Out Score</th>
                    <th>Percentage Scale</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.student_name}</strong></td>
                      <td className="muted">{r.roll_no}</td>
                      <td>{r.assessment}</td>
                      <td>{lessons.find((l) => l.id === r.lesson_plan_id)?.title || <span className="muted">—</span>}</td>
                      <td>{r.score} / {r.max_score}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{r.percentage}%</span>
                          <div className="bar" style={{ width: 80 }}>
                            <span style={{ width: `${Math.min(100, r.percentage)}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}