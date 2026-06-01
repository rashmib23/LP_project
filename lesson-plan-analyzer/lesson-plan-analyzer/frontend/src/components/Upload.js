import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [co, setCo] = useState("");
  const [po, setPo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!file) return setError("Please choose a PDF, DOCX, or TXT file.");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);
    fd.append("subject", subject);
    fd.append("course_outcome", co);
    fd.append("program_outcome", po);
    setBusy(true);
    try {
      const r = await api.post("/lessons/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/lessons/${r.data.lesson.id}`);
    } catch (err) {
      if (!err.response) {
        setError(
          "Cannot reach the backend at " +
            (api.defaults.baseURL || "http://localhost:5000/api") +
            ". Make sure the Flask server is running (cd backend && python app.py)."
        );
      } else if (err.response.status === 401 || err.response.status === 422) {
        setError("Your session has expired. Please log out and log in again.");
      } else {
        setError(
          err.response.data?.error ||
            err.response.data?.msg ||
            `Upload failed (HTTP ${err.response.status}).`
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Upload</div>
        <h1>Analyze a lesson plan</h1>
        <p>
          PDF works best. The system extracts the text, classifies it against Bloom&rsquo;s
          Taxonomy and the teaching strategy, and produces concrete recommendations.
        </p>
      </div>

      <div className="card">
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div>
              <label>Lesson title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Introduction to Neural Networks"
              />
            </div>
            <div>
              <label>Subject / course</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="CS401 Deep Learning"
              />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label>Course Outcome (CO) mapping</label>
              <input
                type="text"
                value={co}
                onChange={(e) => setCo(e.target.value)}
                placeholder="CO2, CO3"
              />
            </div>
            <div>
              <label>Program Outcome (PO) mapping</label>
              <input
                type="text"
                value={po}
                onChange={(e) => setPo(e.target.value)}
                placeholder="PO1, PO3, PO5"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Lesson plan file</label>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="field-hint">
              Accepted formats: <code>.pdf</code>, <code>.docx</code>, <code>.txt</code>. Maximum 16&nbsp;MB.
              {file && <> Selected: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB).</>}
            </div>
          </div>

          <hr className="divider" />

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button type="submit" disabled={busy}>
              {busy ? "Analyzing…" : "Analyze lesson plan"}
            </button>
            <span className="muted small">
              Analysis usually completes in a few seconds.
            </span>
          </div>
        </form>
      </div>
    </>
  );
}
