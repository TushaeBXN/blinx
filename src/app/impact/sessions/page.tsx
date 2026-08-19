"use client";

import { useEffect, useState } from "react";

interface Session {
  id: string;
  title: string;
  type: string;
  date: string;
  organization: string;
  participantCount: number;
  topic: string;
  notes: string | null;
  status: string;
  feedback: { overallRating: number }[];
}

const SESSION_TYPES = ["coaching", "workshop", "econference", "consultation", "presentation"];
const TYPE_LABELS: Record<string, string> = {
  coaching: "Coaching", workshop: "Workshop", econference: "E-Conference",
  consultation: "Consultation", presentation: "Presentation",
};
const STATUS_COLOR: Record<string, string> = {
  completed: "#34C759", scheduled: "#007AFF", cancelled: "#FF3B30",
};

const BLANK = { title: "", type: "coaching", date: "", organization: "", participantCount: "", topic: "", notes: "", status: "completed" };

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/impact/sessions").then(r => r.json()).then(data => {
      setSessions(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title || !form.date || !form.organization || !form.topic) return;
    setSaving(true);
    await fetch("/api/impact/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setShowForm(false);
    setForm({ ...BLANK });
    load();
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Session Log</h1>
          <p style={{ color: "#6E6E73", fontSize: 14, marginTop: 4 }}>Every coaching session, workshop, and conference you run.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: "#007AFF", color: "#fff", border: "none", borderRadius: 10,
          padding: "9px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          {showForm ? "Cancel" : "+ Log Session"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", marginBottom: 16 }}>New Session</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { key: "title", label: "Session Title", placeholder: "e.g. Equity in Education Workshop" },
              { key: "organization", label: "School / Organization", placeholder: "e.g. Carver High School" },
              { key: "topic", label: "Topic / Focus Area", placeholder: "e.g. Culturally responsive teaching" },
            ].map(f => (
              <div key={f.key} style={{ gridColumn: f.key === "topic" ? "1 / -1" : "auto" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", display: "block", marginBottom: 4 }}>{f.label}</label>
                <input
                  value={(form as Record<string, string>)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E0E0E0", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", display: "block", marginBottom: 4 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E0E0E0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", display: "block", marginBottom: 4 }}>Participants</label>
              <input type="number" value={form.participantCount} onChange={e => setForm(prev => ({ ...prev, participantCount: e.target.value }))}
                placeholder="0" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E0E0E0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", display: "block", marginBottom: 4 }}>Type</label>
              <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E0E0E0", fontSize: 14, boxSizing: "border-box" }}>
                {SESSION_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", display: "block", marginBottom: 4 }}>Status</label>
              <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E0E0E0", fontSize: 14, boxSizing: "border-box" }}>
                <option value="completed">Completed</option>
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", display: "block", marginBottom: 4 }}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Key moments, follow-up needed, observations…" rows={3}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E0E0E0", fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>
          <button onClick={save} disabled={saving} style={{
            marginTop: 16, background: "#007AFF", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Saving…" : "Save Session"}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#8E8E93" }}>Loading…</p>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#8E8E93" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#1D1D1F" }}>No sessions yet</p>
          <p>Click "+ Log Session" to record your first coaching session or workshop.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sessions.map(s => {
            const avg = s.feedback.length
              ? (s.feedback.reduce((sum, f) => sum + f.overallRating, 0) / s.feedback.length).toFixed(1)
              : null;
            return (
              <div key={s.id} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{s.title}</p>
                    <span style={{ fontSize: 11, background: "#F5F5F7", color: "#6E6E73", borderRadius: 6, padding: "2px 8px" }}>{TYPE_LABELS[s.type] || s.type}</span>
                    <span style={{ fontSize: 11, color: STATUS_COLOR[s.status] || "#6E6E73", fontWeight: 600 }}>● {s.status}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6E6E73", margin: 0 }}>
                    {s.organization} · {s.participantCount} participants · {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p style={{ fontSize: 12, color: "#8E8E93", margin: "4px 0 0" }}>{s.topic}</p>
                </div>
                {avg && (
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#34C759", margin: 0 }}>{avg}</p>
                    <p style={{ fontSize: 11, color: "#8E8E93", margin: 0 }}>/ 5 rating</p>
                  </div>
                )}
                {s.feedback.length === 0 && (
                  <span style={{ fontSize: 12, color: "#8E8E93" }}>{s.feedback.length} responses</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
