import React, { useState } from "react";
import api from "../api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

const BLOOM_COLORS = { Remember: "#3949a3", Understand: "#0f7c66", Apply: "#b46a00", Analyze: "#7a3a9c", Evaluate: "#b3284c", Create: "#1d4f6b" };
const FALLBACK_COLORS = ["#3949a3", "#0f7c66", "#b46a00", "#7a3a9c", "#b3284c", "#1d4f6b"];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [co, setCo] = useState("");
  const [po, setPo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  
  // Post-Extraction Matrix Content State
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeTab, setActiveTab] = useState("bloom");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!file) return setError("Please choose a valid text or docx/pdf system file.");
    
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
      setAnalysisResult(r.data.lesson);
    } catch (err) {
      setError(err.response?.data?.error || "Processing failure during analytical interpretation parsing lines.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Operational Processing Space</div>
        <h1>Lesson Plan Upload</h1>
        <p>Extract semantic structures via deep learning models to audit learning indicators, milestone alignments, and structural gaps.</p>
      </div>

      {/* Full-width configuration row */}
      <div className="card" style={{ width: "100%" }}>
        <div className="section-head"><h2>Document Intake Block</h2></div>
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div>
              <label>Lesson Title Configuration</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Cryptographic Handshakes Overview" required />
            </div>
            <div>
              <label>Subject Stream / Branch Index</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., CS502 Network Security" />
            </div>
          </div>
          
          <div className="form-row">
            <div>
              <label>Course Outcomes Map Target (CO)</label>
              <input type="text" value={co} onChange={(e) => setCo(e.target.value)} placeholder="CO1, CO4" />
            </div>
            <div>
              <label>Program Outcomes Map Target (PO)</label>
              <input type="text" value={po} onChange={(e) => setPo(e.target.value)} placeholder="PO2, PO3" />
            </div>
          </div>

          <div className="form-group">
            <label>Upload Lesson Plan Document</label>
            <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          </div>

          <hr className="divider" />
          <button type="submit" disabled={busy}>{busy ? "Parsing Evaluation Parameters..." : "Analyze Document Structure"}</button>
        </form>
      </div>

      {/* Full-width analytics results container */}
      {analysisResult && (
        <div className="card" style={{ width: "100%", marginTop: "24px" }}>
          <div className="section-head"><h2>Analytical Metric Result Visualizations</h2></div>
          
          {/* Section Selection Toggles */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
            <button type="button" className={activeTab === "bloom" ? "small" : "secondary small"} onClick={() => setActiveTab("bloom")}>Bloom Taxonomy Distribution</button>
            <button type="button" className={activeTab === "strategy" ? "small" : "secondary small"} onClick={() => setActiveTab("strategy")}>Teaching Strategy Weights</button>
            <button type="button" className={activeTab === "recommendations" ? "small" : "secondary small"} onClick={() => setActiveTab("recommendations")}>Structural Improvements Recommendations</button>
          </div>

          {/* Tab Content Display Area */}
          <div style={{ padding: "20px", background: "var(--surface-2)", borderRadius: "8px", border: "1px solid var(--line)" }}>
            {activeTab === "bloom" && (
              <div>
                <h3>Bloom Cognitive Domain Distribution</h3>
                <p>Assigned Focus Level Category: <span className="tag ok">{analysisResult.bloom_level}</span> (Confidence: {Math.round(analysisResult.bloom_confidence * 100)}%)</p>
                
                {/* Labeled Distribution Chart */}
                <div style={{ width: "100%", height: "300px", marginTop: "20px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(analysisResult.analysis?.bloom_distribution || {}).map(([k, v]) => ({ name: k, value: +(v * 100).toFixed(2) }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis unit="%" />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {Object.entries(analysisResult.analysis?.bloom_distribution || {}).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BLOOM_COLORS[entry[0]] || FALLBACK_COLORS[index % 6]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === "strategy" && (
              <div>
                <h3>Pedagogical Strategy Spectrum Weights</h3>
                <p>Primary Strategy: <span className="tag info">{analysisResult.teaching_strategy}</span> (Confidence: {Math.round(analysisResult.strategy_confidence * 100)}%)</p>
                
                {/* Labeled Strategy Distribution Chart */}
                <div style={{ width: "100%", height: "300px", marginTop: "20px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(analysisResult.analysis?.strategy_distribution || {}).map(([k, v]) => ({ name: k, value: +(v * 100).toFixed(2) }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis unit="%" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0f7c66" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === "recommendations" && (
              <div>
                <h3>Structural Modifications Matrix Suggestions</h3>
                {(!analysisResult.recommendations || analysisResult.recommendations.length === 0) ? (
                  <p className="muted">This document cleanly balances learning outcomes parameters perfectly.</p>
                ) : (
                  analysisResult.recommendations.map((r, i) => (
                    <div key={i} className={`rec ${r.severity}`} style={{ margin: "12px 0" }}>
                      <div className="cat">{r.category} &middot; {r.severity}</div>
                      <p>{r.suggestion}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}