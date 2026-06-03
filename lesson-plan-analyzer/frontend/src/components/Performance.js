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
  const [showDataLedger, setShowDataLedger] = useState(false); // Hidden by default

  // Dynamic Chart Filter State: Tracks which lesson plan the user wants to inspect
  const [selectedChartLessonId, setSelectedChartLessonId] = useState("");

  // Standard Email/Inbox style selection state layer
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);

  const [form, setForm] = useState({
    lesson_plan_id: "", student_name: "", roll_no: "",
    assessment: "", score: "", max_score: 100, remarks: "",
  });
  const [csv, setCsv] = useState(null);
  const [csvLessonPlanId, setCsvLessonPlanId] = useState(""); 
  const [msg, setMsg] = useState("");
  const [importErrors, setImportErrors] = useState([]);

  const refresh = () => {
    api.get("/lessons/").then((r) => setLessons(r.data.lessons || []));
    api.get("/performance/").then((r) => setRecords(r.data.records || []));
    api.get("/performance/analytics").then((r) => setAnalytics(r.data));
    setSelectedRecordIds([]); 
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
    fd.append("lesson_plan_id", csvLessonPlanId);
    
    try {
      const r = await api.post("/performance/bulk", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg(`Imported ${r.data.created} record(s) cleanly.`);
      if (r.data.errors && r.data.errors.length > 0) {
        setImportErrors(r.data.errors);
      }
      setCsv(null);
      setCsvLessonPlanId(""); 
      refresh();
    } catch (err) {
      setMsg(err.response?.data?.error || "Bulk import failed.");
    }
  };

  const onDeleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to drop this individual score entry?")) return;
    setMsg("");
    try {
      await api.delete(`/performance/${id}`);
      setMsg("Record cleared from database parameters successfully.");
      refresh();
    } catch (err) {
      setMsg("Failed to remove selected record.");
    }
  };

  const handleSelectAllChange = (e) => {
    if (e.target.checked) {
      setSelectedRecordIds(records.map((r) => r.id));
    } else {
      setSelectedRecordIds([]);
    }
  };

  const handleRowCheckboxChange = (id) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const onDeleteSelectedRecords = async () => {
    if (selectedRecordIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently clear the ${selectedRecordIds.length} selected record(s)?`)) return;

    setMsg("Clearing queued records sequentially...");
    let successCount = 0;
    let failCount = 0;

    try {
      for (const id of selectedRecordIds) {
        try {
          await api.delete(`/performance/${id}`);
          successCount++;
        } catch (rowErr) {
          failCount++;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      setMsg(`Successfully cleared ${successCount} selected performance sheets perfectly.`);
      refresh();
    } catch (err) {
      setMsg("Purge batch loop encountered an unexpected execution failure.");
      refresh();
    }
  };

  // --- Chart 1 Generation: Average Score Per Lesson Plan ---
  const byLessonChart = (analytics?.by_lesson || []).map((b) => ({
    name: b.title.length > 14 ? b.title.slice(0, 14) + "…" : b.title,
    avg: b.average_percentage,
    bloom: b.bloom_level,
  }));

  // --- Chart 2 Generation: Interactive Filtering by Selected Lesson Plan ---
  const assessmentGroups = {};
  
  const filteredRecordsForChart = selectedChartLessonId
    ? records.filter((r) => String(r.lesson_plan_id) === String(selectedChartLessonId))
    : records;

  filteredRecordsForChart.forEach((r) => {
    const taskName = r.assessment || "Other Task";
    const pct = r.percentage ?? (r.max_score ? (r.score / r.max_score) * 100 : 0);
    if (!assessmentGroups[taskName]) {
      assessmentGroups[taskName] = { totalPct: 0, count: 0 };
    }
    assessmentGroups[taskName].totalPct += pct;
    assessmentGroups[taskName].count += 1;
  });

  const byAssessmentChart = Object.keys(assessmentGroups).map((task) => ({
    name: task.length > 14 ? task.slice(0, 14) + "…" : task,
    avg: parseFloat((assessmentGroups[task].totalPct / assessmentGroups[task].count).toFixed(2)),
    submissions: assessmentGroups[task].count
  }));

  const isAllSelected = records.length > 0 && selectedRecordIds.length === records.length;

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Performance Hub</div>
        <h1>Student Performance Analysis</h1>
        <p>Add assessment scores and link them directly to your lesson plans to monitor performance trends.</p>
      </div>

      {msg && <div className="alert info">{msg}</div>}

      {importErrors.length > 0 && (
        <div className="alert error" style={{ flexDirection: "column", maxHeight: 180, overflowY: "auto" }}>
          <strong>System Upload Logs:</strong>
          <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
            {importErrors.map((err, idx) => <li key={idx} className="small">{err}</li>)}
          </ul>
        </div>
      )}

      {/* Operational Selection Toggles */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", borderBottom: "1px solid var(--line)" }}>
        <button 
          type="button" 
          onClick={() => setInputViewMode("individual")}
          style={{
            background: inputViewMode === "individual" ? "var(--surface)" : "transparent",
            color: inputViewMode === "individual" ? "var(--primary)" : "var(--muted)",
            border: "1px solid " + (inputViewMode === "individual" ? "var(--line)" : "transparent"),
            borderBottom: inputViewMode === "individual" ? "2px solid var(--primary)" : "1px solid transparent",
            borderRadius: "6px 6px 0 0", padding: "10px 18px", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", transform: "translateY(1px)"
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
            borderRadius: "6px 6px 0 0", padding: "10px 18px", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", transform: "translateY(1px)"
          }}
        >
          Bulk Import CSV
        </button>
      </div>

      {/* Data Ingestion Deck Box */}
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
                <input type="text" value={form.assessment} onChange={(e) => setForm({ ...form, assessment: e.target.value })} placeholder="Quiz 1, Lab Exam, Milestone 3..." required />
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
                <input type="number" step="any" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} required />
              </div>
              <div>
                <label>Maximum Out of Score</label>
                <input type="number" step="any" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} required />
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
            
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label>Choose Target Lesson Plan to Link Records</label>
              <select value={csvLessonPlanId} onChange={(e) => setCsvLessonPlanId(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px" }}>
                <option value="">— Leave Unlinked (General Record) —</option>
                {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Choose CSV Target File</label>
              <input type="file" accept=".csv" onChange={(e) => setCsv(e.target.files?.[0] || null)} required />
              <div className="muted small" style={{ marginTop: "6px" }}>
                Required Columns: <code>student_name</code>, <code>roll_no</code>, <code>assessment</code>, <code>score</code>, <code>max_score</code>, <code>remarks</code>.
              </div>
            </div>
            <button type="submit" disabled={!csv}>Process Data Sheet Ingestion</button>
          </form>
        )}
      </div>

      {/* Analytics Evaluation Block Layout with New Color Palette Overrides */}
      {analytics?.overall?.count > 0 && (
        <div className="card" style={{ width: "100%", marginTop: "24px" }}>
          <div className="section-head"><h2>Outcome Analytics Evaluation</h2></div>
          <div className="grid three" style={{ marginBottom: "30px" }}>
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
          
          {/* Dual Chart Grid Block */}
          <div className="grid two" style={{ gap: "32px", alignItems: "start" }}>
            
            {/* Chart Block A: Lesson Plans (Wider Bars, Deep Emerald Mint) */}
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Performance by Lesson Configuration
              </h3>
              <div style={{ width: "100%", height: "320px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byLessonChart} margin={{ bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "#475569" }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(v, _, p) => [`${v}%`, `Avg (${p.payload.bloom || "—"})`]} />
                    {/* Deep Emerald Mint Accent */}
                    <Bar dataKey="avg" fill="#3aa59c" radius={[5, 5, 0, 0]} maxBarSize={70} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart Block B: Assessment Task Segments (Wider Bars, Warm Terracotta Clay) */}
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "13px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Tasks for Selected Lesson Plan
                </h3>
                
                <select 
                  value={selectedChartLessonId}
                  onChange={(e) => setSelectedChartLessonId(e.target.value)}
                  style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "12px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#334155" }}
                >
                  <option value="">— Show All Tasks —</option>
                  {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>

              <div style={{ width: "100%", height: "320px" }}>
                {byAssessmentChart.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "13px" }}>
                    No tasks linked to this lesson plan yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byAssessmentChart} margin={{ bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                      <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "#475569" }} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(v, _, p) => [`${v}%`, `Average Score (${p.payload.submissions} logs)`]} />
                      {/* Warm Terracotta Clay Accent */}
                      <Bar dataKey="avg" fill="#c46540" radius={[5, 5, 0, 0]} maxBarSize={70} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Ledger Table Section */}
      <div style={{ marginTop: "24px", marginBottom: "40px" }}>
        <button 
          type="button" 
          onClick={() => setShowDataLedger(!showDataLedger)}
          style={{ 
            width: "100%", padding: "14px 20px", background: "var(--surface)", color: "var(--ink-soft)",
            border: "1px dashed var(--line-strong)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow-sm)", cursor: "pointer"
          }} 
        >
          <span style={{ fontWeight: "700", color: "var(--primary)" }}>
            {showDataLedger ? "Hide Logged Student Records Database ↑" : "Show Logged Student Records Database ↓"}
          </span>
          <span className="tag muted">{records.length} Entries Stored</span>
        </button>

        {showDataLedger && (
          <div className="card" style={{ width: "100%", marginTop: "14px" }}>
            <div className="section-head" style={{ borderBottom: "1px solid var(--line)", paddingBottom: "10px", marginBottom: "16px" }}>
              <h2>All Active Storage Student Records</h2>
              {selectedRecordIds.length > 0 && (
                <button type="button" className="danger small" onClick={onDeleteSelectedRecords} style={{ padding: "6px 14px", fontWeight: "700" }}>
                  🗑 Delete Selected ({selectedRecordIds.length})
                </button>
              )}
            </div>

            {records.length === 0 ? (
              <p className="muted">No tracking profiles loaded inside workspace parameters.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "40px", paddingRight: "0" }}>
                      <input type="checkbox" checked={isAllSelected} onChange={handleSelectAllChange} style={{ width: "16px", height: "16px", cursor: "pointer", display: "block" }} />
                    </th>
                    <th>Student Name</th>
                    <th>Roll Ref</th>
                    <th>Assessment Task</th>
                    <th>Lesson Reference Link</th>
                    <th>Raw Out Score</th>
                    <th>Percentage Scale</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const isRowChecked = selectedRecordIds.includes(r.id);
                    const currentLp = lessons.find((l) => l.id === r.lesson_plan_id);
                    const computedPercentage = r.percentage ?? (r.max_score ? Math.round((r.score / r.max_score) * 100) : 0);
                    
                    return (
                      <tr key={r.id} style={{ backgroundColor: isRowChecked ? "rgba(57, 73, 163, 0.05)" : "transparent" }}>
                        <td style={{ paddingRight: "0" }}>
                          <input type="checkbox" checked={isRowChecked} onChange={() => handleRowCheckboxChange(r.id)} style={{ width: "16px", height: "16px", cursor: "pointer", display: "block" }} />
                        </td>
                        <td><strong>{r.student_name}</strong></td>
                        <td className="muted">{r.roll_no}</td>
                        <td>{r.assessment}</td>
                        <td>
                          {currentLp ? (
                            <span style={{ color: "var(--primary)", fontWeight: "600" }}>{currentLp.title}</span>
                          ) : (
                            <span className="tag muted" style={{ fontSize: "11px" }}>Unlinked Row</span>
                          )}
                        </td>
                        <td>{r.score} / {r.max_score}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: "36px" }}>{computedPercentage}%</span>
                            <div className="bar" style={{ width: 80 }}>
                              <span style={{ width: `${Math.min(100, computedPercentage)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button type="button" className="ghost small" style={{ color: "var(--danger)", padding: "4px 8px" }} onClick={() => onDeleteRecord(r.id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}