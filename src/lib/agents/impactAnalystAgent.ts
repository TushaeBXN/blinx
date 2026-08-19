import { callLLM, parseJSON } from "@/lib/llm";
import { prisma } from "@/lib/prisma";

export async function runImpactAnalystAgent(): Promise<{ processed: number; report?: string }> {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return { processed: 0 };

  // Process unscored feedback
  const unscored = await prisma.sessionFeedback.findMany({
    where: { sentimentScore: null },
    include: { session: true },
    take: 20,
  });

  let processed = 0;
  for (const fb of unscored) {
    const text = [fb.keyLearning, fb.biggestChallenge, fb.openFeedback].filter(Boolean).join(" ");
    if (!text.trim()) {
      await prisma.sessionFeedback.update({ where: { id: fb.id }, data: { sentimentScore: 0, themes: "[]" } });
      processed++;
      continue;
    }

    try {
      const raw = await callLLM(
        "You are a sentiment analyst for an education nonprofit. Be concise and accurate.",
        `Rate the sentiment of this feedback from -1 (very negative) to 1 (very positive) and extract 1-3 key themes. Return JSON only: {"score": number, "themes": ["theme1"]}

Feedback: "${text.slice(0, 800)}"`,
        256,
        { taskType: "analysis" }
      );
      const parsed = parseJSON<{ score: number; themes: string[] }>(raw);
      await prisma.sessionFeedback.update({
        where: { id: fb.id },
        data: {
          sentimentScore: Math.max(-1, Math.min(1, parsed.score ?? 0)),
          themes: JSON.stringify(parsed.themes ?? []),
        },
      });
    } catch {
      await prisma.sessionFeedback.update({ where: { id: fb.id }, data: { sentimentScore: 0, themes: "[]" } });
    }
    processed++;
  }

  await prisma.activityLog.create({
    data: { agentId: "impactAnalystAgent", label: `Impact Analyst: scored ${processed} feedback responses` },
  });

  await prisma.agentRun.create({
    data: { agentId: "impactAnalystAgent", agentName: "Impact Analyst", status: "success", output: JSON.stringify({ processed }) },
  });

  return { processed };
}

export async function generateImpactReport(userId: string, period: string, year: number): Promise<string> {
  const sessions = await prisma.engagementSession.findMany({
    where: { userId, status: "completed" },
    include: { feedback: true },
    orderBy: { date: "desc" },
  });

  const metrics = await prisma.impactMetric.findMany({
    where: { userId, period, year },
  });

  const totalParticipants = sessions.reduce((sum, s) => sum + s.participantCount, 0);
  const avgRating = sessions.flatMap(s => s.feedback).reduce((acc, f, _, arr) => acc + f.overallRating / arr.length, 0);
  const quotes = sessions
    .flatMap(s => s.feedback)
    .filter(f => f.openFeedback && f.sentimentScore && f.sentimentScore > 0.3)
    .slice(0, 3)
    .map(f => f.openFeedback);

  const orgProfile = await prisma.orgProfile.findFirst({ where: { userId } });
  const orgName = orgProfile?.orgName ?? "the organization";

  const prompt = `You are writing a quarterly impact narrative for ${orgName}, an education nonprofit.

DATA FOR ${period} ${year}:
- Total sessions: ${sessions.length}
- Total participants: ${totalParticipants}
- Session types: ${[...new Set(sessions.map(s => s.type))].join(", ")}
- Organizations served: ${[...new Set(sessions.map(s => s.organization))].slice(0, 5).join(", ")}
- Average satisfaction: ${avgRating.toFixed(1)}/5
- Custom metrics: ${metrics.map(m => `${m.name}: ${m.value} ${m.unit}`).join(", ") || "none recorded"}
- Real quotes from participants: ${quotes.length > 0 ? quotes.map(q => `"${q}"`).join("; ") : "not yet collected"}

Write a 3-paragraph impact narrative for a funder or board report:
1. Open with the human story — who was served and what changed
2. The numbers that prove scale and quality
3. Forward-looking: what this means for the mission

Be specific, warm, and evidence-based. Do not use placeholders. Return plain text only.`;

  const narrative = await callLLM(
    "You write compelling nonprofit impact narratives that move funders to action.",
    prompt,
    800,
    { taskType: "writing" }
  );

  const highlights = JSON.stringify({ totalSessions: sessions.length, totalParticipants, avgRating: parseFloat(avgRating.toFixed(1)), quotes });
  const metricsSnap = JSON.stringify(metrics.map(m => ({ name: m.name, value: m.value, unit: m.unit })));

  await prisma.impactReport.create({
    data: { userId, period, year, narrative, highlights, metrics: metricsSnap },
  });

  await prisma.activityLog.create({
    data: { agentId: "impactAnalystAgent", label: `Impact Analyst: generated ${period} ${year} impact report for ${orgName}` },
  });

  return narrative;
}
