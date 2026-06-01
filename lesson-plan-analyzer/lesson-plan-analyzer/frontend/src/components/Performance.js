import React, { useEffect, useState } from "react";
import api from "../api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function Performance() {
  const [lessons, setLessons] = useState([]);
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
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
      setMsg("Record added.");
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
      const parts = [`Imported ${r.data.created} record(s)`];
      if (r.data.relinked) parts.push(`${r.data.relinked} saved as Unlinked (lesson_plan_id not yours)`);
      if (r.data.errors?.length) parts.push(`${r.data.errors.length} error(s)`);
      setMsg(parts.join(" · "));
      setImportErrors(r.data.errors || []);
      setCsv(null);
      refresh();
    } catch (err) {
      if (!err.response) {
        setMsg(
          "Cannot reach the backend at " +
          (api.defaults.baseURL || "http://localhost:5000/api") +
          ". Make sure the Flask server is running."
        );
      } else {
        setMsg(err.response.data?.error || `Import failed (HTTP ${err.response.status}).`);
      }
    }
  };

  const byLessonChart = (analytics?.by_lesson || []).map((b) => ({
    name: b.title.length > 18 ? b.title.slice(0, 18) + "…" : b.title,
    avg: b.average_percentage,
    bloom: b.bloom_level,
  }));

  const isError = msg.toLowerCase().includes("fail") ||
                  msg.toLowerCase().includes("cannot") ||
                  msg.toLowerCase().includes("error") ||
                  importErrors.length > 0;

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Performance</div>
        <h1>Student outcomes</h1>
        <p>
          Add scores per assessment and link them to a lesson plan. The system uses the link
          to correlate teaching strategy and Bloom&rsquo;s level with learning outcomes.
        </p>
      </div>

      {msg && (
        <div className={`alert ${isError ? "error" : "success"}`}>{msg}</div>
      )}
      {importErrors.length > 0 && (
        <div className="alert error" style={{ flexDirection: "column", maxHeight: 220, overflow: "auto" }}>
          <strong>Import errors (first 20 shown):</strong>
          <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
            {importErrors.slice(0, 20).map((e, i) => (
              <li key={i} className="small">{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid two">
        <div className="card">
          <div className="section-head"><h2>Add a single record</h2></div>
          <form onSubmit={onAdd}>
            <div className="form-row">
              <div>
                <label>Linked lesson plan (optional)</label>
                <select
                  value={form.lesson_plan_id}
                  onChange={(e) => setForm({ ...form, lesson_plan_id: e.target.value })}
                >
                  <option value="">— none —</option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Assessment</label>
                <input
                  type="text"
                  value={form.assessment}
                  onChange={(e) => setForm({ ...form, assessment: e.target.value })}
                  placeholder="Quiz 1, Mid-term…"
                />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Student name</label>
                <input
                  type="text"
                  value={form.student_name}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                  placeholder="Aarav Kumar"
                />
              </div>
              <div>
                <label>Roll no.</label>
                <input
                  type="text"
                  value={form.roll_no}
                  onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                  placeholder="21CS001"
                />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Score</label>
                <input
                  type="number"
                  required
                  value={form.score}
                  onChange={(e) => setForm({ ...form, score: e.target.value })}
                />
              </div>
              <div>
                <label>Max score</label>
                <input
                  type="number"
                  value={form.max_score}
                  onChange={(e) => setForm({ ...form, max_score: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <input
                type="text"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
            <button type="submit">Add record</button>
          </form>
        </div>

        <div className="card">
          <div className="section-head"><h2>Bulk import (CSV)</h2></div>
          <p className="muted small">
            Required columns: <code>student_name</code>, <code>roll_no</code>,
            <code> assessment</code>, <code>score</code>, <code>max_score</code>,
            <code> remarks</code>, <code>lesson_plan_id</code>.
          </p>

          <div className="alert info" style={{ flexDirection: "column" }}>
            <strong>Your lesson plan IDs</strong>
            {lessons.length === 0 ? (
              <span className="small">
                You don&rsquo;t own any lesson plans yet. Leave <code>lesson_plan_id</code> blank
                in your CSV (records will be saved as &ldquo;Unlinked&rdquo;), or upload a lesson
                plan first.
              </span>
            ) : (
              <>
                <span className="small">
                  In your CSV, the <code>lesson_plan_id</code> column must contain one of:
                </span>
                <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                  {lessons.map((l) => (
                    <li key={l.id} className="small">
                      <code>{l.id}</code> &mdash; {l.title}
                    </li>
                  ))}
                </ul>
                <span className="small" style={{ marginTop: 6 }}>
                  Or leave the column blank to save the rows as &ldquo;Unlinked&rdquo;.
                </span>
              </>
            )}
          </div>

          <form onSubmit={onCsvUpload}>
            <div className="form-group">
              <label>Choose CSV file</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsv(e.target.files?.[0] || null)}
              />
              <div className="field-hint">
                {csv
                  ? <>Selected: <strong>{csv.name}</strong> ({Math.round(csv.size / 1024)} KB).</>
                  : <>UTF-8 encoded files only.</>}
              </div>
            </div>
            <div className="form-group">
              <label
                htmlFor="ignore-lp"
                style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer", margin: 0 }}
              >
                <input
                  id="ignore-lp"
                  type="checkbox"
                  checked={ignoreInvalidLp}
                  onChange={(e) => setIgnoreInvalidLp(e.target.checked)}
                  style={{ width: "auto", marginTop: 3 }}
                />
                <span className="small">
                  Save rows as <strong>Unlinked</strong> when their <code>lesson_plan_id</code>
                  {" "}doesn&rsquo;t belong to me. Recommended &mdash; otherwise rows with unknown
                  IDs are rejected.
                </span>
              </label>
            </div>
            <button type="submit" disabled={!csv}>Import CSV</button>
          </form>
        </div>
      </div>

      {analytics?.overall?.count > 0 && (
        <div className="card">
          <div className="section-head"><h2>Outcome analytics</h2></div>
          <div className="grid three">
            <div className="kpi">
              <div className="label">Records</div>
              <div className="value">{analytics.overall.count}</div>
            </div>
            <div className="kpi">
              <div className="label">Average</div>
              <div className="value">{analytics.overall.average_percentage}%</div>
            </div>
            <div className="kpi">
              <div className="label">Pass rate</div>
              <div className="value">{analytics.overall.pass_rate}%</div>
            </div>
          </div>
          <h3 className="spaced">Average score per lesson plan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byLessonChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ecebe4" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e2dfd6" }} tickLine={false} />
              <YAxis unit="%" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e2dfd6" }} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(57,73,163,0.06)" }}
                formatter={(v, _, p) => [`${v}%`, `Avg (${p.payload.bloom || "—"})`]}
              />
              <Bar dataKey="avg" fill="#3949a3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <div className="section-head"><h2>All records</h2></div>
        {records.length === 0 ? (
          <p className="muted">No records yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll</th>
                <th>Assessment</th>
                <th>Lesson plan</th>
                <th>Score</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const lp = lessons.find((l) => l.id === r.lesson_plan_id);
                return (
                  <tr key={r.id}>
                    <td><strong>{r.student_name}</strong></td>
                    <td className="muted">{r.roll_no}</td>
                    <td>{r.assessment}</td>
                    <td>{lp ? lp.title : <span className="muted">—</span>}</td>
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
