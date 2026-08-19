"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Session {
  id: string;
  title: string;
  type: string;
  date: string;
  organization: string;
  participantCount: number;
  topic: string;
  status: string;
  feedback: { overallRating: number; sentimentScore: number | null }[];
}

interface Metric {
  id: string;
  name: string;
  unit: string;
  value: number;
  period: string;
  year: number;
}

const TYPE_LABELS: Record<string, string> = {
  coaching: "Coaching",
  workshop: "Workshop",
  econference: "E-Conference",
  consultation: "Consultation",
  presentation: "Presentation",
};

export default function ImpactDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/impact/sessions").then(r => r.json()),
      fetch("/api/impact/metrics").then(r => r.json()),
    ]).then(([s, m]) => {
      setSessions(Array.isArray(s) ? s : []);
      setMetrics(Array.isArray(m) ? m : []);
      setLoading(false);
    });
  }, []);

  const totalParticipants = sessions.reduce((sum, s) => sum + s.participantCount, 0);
  const totalSessions = sessions.length;
  const allFeedback = sessions.flatMap(s => s.feedback);
  const avgRating = allFeedback.length
    ? allFeedback.reduce((sum, f) => sum + f.overallRating, 0) / allFeedback.length
    : 0;
  const orgs = [...new Set(sessions.map(s => s.organization))].length;
  const recent = sessions.slice(0, 5);
  const currentYear = new Date().getFullYear();
  const ytdMetrics = metrics.filter(m => m.year === currentYear);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Impact Dashboard</h1>
          <p style={{ color: "#6E6E73", fontSize: 14, marginTop: 4 }}>Track sessions, measure outcomes, prove your mission.</p>
        </div>
        <Link href="/impact/sessions" style={{
          background: "#007AFF", color: "#fff", borderRadius: 10, padding: "9px 18px",
          fontSize: 14, fontWeight: 600, textDecoration: "none",
        }}>
          + Log Session
        </Link>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "People Served", value: loading ? "—" : totalParticipants.toLocaleString(), color: "#007AFF" },
          { label: "Sessions", value: loading ? "—" : totalSessions, color: "#34C759" },
          { label: "Orgs Engaged", value: loading ? "—" : orgs, color: "#FF9500" },
          { label: "Avg. Satisfaction", value: loading ? "—" : avgRating ? `${avgRating.toFixed(1)}/5` : "—", color: "#5856D6" },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: "#fff", borderRadius: 14, padding: "20px 20px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 6px" }}>{kpi.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: kpi.color, margin: 0 }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        {/* Recent Sessions */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Recent Sessions</h2>
            <Link href="/impact/sessions" style={{ fontSize: 13, color: "#007AFF", textDecoration: "none" }}>View all →</Link>
          </div>
          {loading ? (
            <p style={{ color: "#8E8E93", fontSize: 14 }}>Loading…</p>
          ) : recent.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ color: "#8E8E93", fontSize: 14 }}>No sessions logged yet.</p>
              <Link href="/impact/sessions" style={{ color: "#007AFF", fontSize: 14, textDecoration: "none" }}>Log your first session →</Link>
            </div>
          ) : (
            recent.map(s => (
              <div key={s.id} style={{ padding: "10px 0", borderBottom: "1px solid #F0F0F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", margin: "0 0 2px" }}>{s.title}</p>
                    <p style={{ fontSize: 12, color: "#8E8E93", margin: 0 }}>{s.organization} · {s.participantCount} participants</p>
                  </div>
                  <span style={{ fontSize: 11, background: "#F0F7FF", color: "#007AFF", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                    {TYPE_LABELS[s.type] || s.type}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { href: "/impact/sessions", label: "Session Log", desc: "Record coaching, workshops, and conferences", icon: "📋", color: "#007AFF" },
            { href: "/impact/feedback", label: "Feedback & Sentiment", desc: "View participant responses and trends", icon: "💬", color: "#34C759" },
            { href: "/impact/reports", label: "Impact Reports", desc: "AI-generated quarterly narratives for funders", icon: "📄", color: "#5856D6" },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              background: "#fff", borderRadius: 14, padding: "18px 20px",
              boxShadow: "0 1px 8px rgba(0,0,0,0.06)", textDecoration: "none", display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ fontSize: 24, lineHeight: 1 }}>{item.icon}</div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 2px" }}>{item.label}</p>
                <p style={{ fontSize: 12, color: "#8E8E93", margin: 0 }}>{item.desc}</p>
              </div>
            </Link>
          ))}

          {ytdMetrics.length > 0 && (
            <div style={{ background: "#F0F7FF", borderRadius: 14, padding: "18px 20px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#007AFF", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.8 }}>YTD Metrics</p>
              {ytdMetrics.slice(0, 3).map(m => (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#1D1D1F" }}>{m.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>{m.value} {m.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
