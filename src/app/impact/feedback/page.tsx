"use client";

import { useEffect, useState } from "react";

interface Feedback {
  id: string;
  respondentRole: string;
  overallRating: number;
  keyLearning: string | null;
  biggestChallenge: string | null;
  wouldRecommend: boolean;
  openFeedback: string | null;
  sentimentScore: number | null;
  themes: string | null;
  submittedAt: string;
  session: { title: string; organization: string; date: string };
}

const ROLE_LABELS: Record<string, string> = {
  educator: "Educator", administrator: "Administrator", student: "Student", caregiver: "Caregiver", other: "Other",
};

const STARS = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

const sentimentColor = (score: number | null) => {
  if (score === null) return "#8E8E93";
  if (score > 0.3) return "#34C759";
  if (score < -0.3) return "#FF3B30";
  return "#FF9500";
};

const sentimentLabel = (score: number | null) => {
  if (score === null) return "Pending";
  if (score > 0.3) return "Positive";
  if (score < -0.3) return "Negative";
  return "Neutral";
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/impact/feedback").then(r => r.json()).then(data => {
      setFeedback(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const avgRating = feedback.length
    ? (feedback.reduce((sum, f) => sum + f.overallRating, 0) / feedback.length).toFixed(1)
    : null;
  const positiveCount = feedback.filter(f => f.sentimentScore !== null && f.sentimentScore > 0.3).length;
  const wouldRecommend = feedback.filter(f => f.wouldRecommend).length;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Feedback & Sentiment</h1>
        <p style={{ color: "#6E6E73", fontSize: 14, marginTop: 4 }}>What participants are saying about AHIE's work.</p>
      </div>

      {!loading && feedback.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Avg. Rating", value: avgRating ? `${avgRating}/5` : "—", color: "#34C759" },
            { label: "Positive Sentiment", value: `${positiveCount}/${feedback.length}`, color: "#007AFF" },
            { label: "Would Recommend", value: `${wouldRecommend}/${feedback.length}`, color: "#5856D6" },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 6px" }}>{kpi.label}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: kpi.color, margin: 0 }}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#8E8E93" }}>Loading…</p>
      ) : feedback.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#8E8E93" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#1D1D1F" }}>No feedback yet</p>
          <p>Share the feedback form link with participants after a session. Each response is analyzed automatically.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {feedback.map(f => {
            const parsedThemes: string[] = (() => { try { return JSON.parse(f.themes || "[]"); } catch { return []; } })();
            return (
              <div key={f.id} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: "0 0 2px" }}>
                      {ROLE_LABELS[f.respondentRole] || f.respondentRole} — {f.session.organization}
                    </p>
                    <p style={{ fontSize: 12, color: "#8E8E93", margin: 0 }}>{f.session.title} · {new Date(f.session.date).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16, color: "#FFD700", letterSpacing: -1 }}>{STARS(f.overallRating)}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: sentimentColor(f.sentimentScore),
                      background: `${sentimentColor(f.sentimentScore)}15`, borderRadius: 6, padding: "2px 8px",
                    }}>
                      {sentimentLabel(f.sentimentScore)}
                    </span>
                  </div>
                </div>
                {f.keyLearning && (
                  <p style={{ fontSize: 13, color: "#1D1D1F", margin: "0 0 6px" }}>
                    <strong>Key learning:</strong> {f.keyLearning}
                  </p>
                )}
                {f.openFeedback && (
                  <p style={{ fontSize: 13, color: "#6E6E73", fontStyle: "italic", margin: "0 0 6px", borderLeft: "3px solid #E0E0E0", paddingLeft: 10 }}>
                    "{f.openFeedback}"
                  </p>
                )}
                {parsedThemes.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {parsedThemes.map(t => (
                      <span key={t} style={{ fontSize: 11, background: "#F5F5F7", color: "#6E6E73", borderRadius: 6, padding: "2px 8px" }}>{t}</span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 11, color: "#C7C7CC", margin: "8px 0 0" }}>
                  {f.wouldRecommend ? "✓ Would recommend" : "✗ Would not recommend"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
