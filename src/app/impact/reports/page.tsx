"use client";

import { useEffect, useState } from "react";

interface Report {
  id: string;
  period: string;
  year: number;
  narrative: string;
  highlights: string | null;
  generatedAt: string;
}

const PERIODS = ["Q1", "Q2", "Q3", "Q4", "Annual"];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState("Q2");
  const [year, setYear] = useState(new Date().getFullYear());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/impact/reports").then(r => r.json()).then(data => {
      setReports(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/impact/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, year }),
      });
      if (!res.ok) throw new Error("Generation failed");
      load();
    } catch {
      setError("Could not generate report. Make sure you have sessions logged first.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Impact Reports</h1>
        <p style={{ color: "#6E6E73", fontSize: 14, marginTop: 4 }}>
          AI-generated quarterly narratives for funders and board members — written from your real session data.
        </p>
      </div>

      {/* Generate panel */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", marginBottom: 14 }}>Generate a New Report</h3>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", display: "block", marginBottom: 4 }}>Period</label>
            <select value={period} onChange={e => setPeriod(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #E0E0E0", fontSize: 14 }}>
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", display: "block", marginBottom: 4 }}>Year</label>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))}
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #E0E0E0", fontSize: 14 }}>
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={generate} disabled={generating} style={{
            background: generating ? "#8E8E93" : "#5856D6", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600,
            cursor: generating ? "not-allowed" : "pointer",
          }}>
            {generating ? "Generating…" : "Generate Report"}
          </button>
        </div>
        {error && <p style={{ color: "#FF3B30", fontSize: 13, marginTop: 10 }}>{error}</p>}
        <p style={{ fontSize: 12, color: "#8E8E93", marginTop: 12 }}>
          Uses your logged sessions, participant counts, feedback ratings, and custom metrics. Takes ~10 seconds.
        </p>
      </div>

      {loading ? (
        <p style={{ color: "#8E8E93" }}>Loading…</p>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#8E8E93" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#1D1D1F" }}>No reports yet</p>
          <p>Log some sessions, then generate your first impact report above.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {reports.map(r => {
            const highlights = (() => { try { return JSON.parse(r.highlights || "{}"); } catch { return {}; } })();
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  style={{
                    width: "100%", padding: "18px 24px", background: "none", border: "none",
                    cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>
                      {r.period} {r.year} Impact Report
                    </p>
                    <div style={{ display: "flex", gap: 16 }}>
                      {highlights.totalSessions && <span style={{ fontSize: 12, color: "#8E8E93" }}>{highlights.totalSessions} sessions</span>}
                      {highlights.totalParticipants && <span style={{ fontSize: 12, color: "#8E8E93" }}>{highlights.totalParticipants} participants</span>}
                      {highlights.avgRating && <span style={{ fontSize: 12, color: "#8E8E93" }}>{highlights.avgRating}/5 avg rating</span>}
                      <span style={{ fontSize: 12, color: "#8E8E93" }}>
                        Generated {new Date(r.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 20, color: "#8E8E93" }}>{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div style={{ padding: "0 24px 24px", borderTop: "1px solid #F0F0F0" }}>
                    {highlights.quotes && highlights.quotes.length > 0 && (
                      <div style={{ margin: "16px 0", background: "#F0F7FF", borderRadius: 10, padding: 16 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#007AFF", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.8 }}>Participant Voices</p>
                        {highlights.quotes.map((q: string, i: number) => (
                          <p key={i} style={{ fontSize: 14, color: "#1D1D1F", fontStyle: "italic", margin: "0 0 8px", borderLeft: "3px solid #007AFF", paddingLeft: 10 }}>
                            "{q}"
                          </p>
                        ))}
                      </div>
                    )}
                    <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, color: "#1D1D1F", marginTop: 16 }}>
                      {r.narrative}
                    </div>
                    <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                      <button
                        onClick={() => navigator.clipboard.writeText(r.narrative)}
                        style={{ background: "#F5F5F7", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#1D1D1F", cursor: "pointer" }}>
                        Copy Text
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
