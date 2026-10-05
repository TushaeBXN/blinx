export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { callLLM, parseJSON } from "@/lib/llm";
import { routeByTaskType } from "@/lib/modelRouter";
import type { OpportunityScore } from "@/lib/agents/salesAgent";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyName, companySize, revenue, painPoints, growthSignals, decisionMakers, ourValueProp, ourProduct, userSettings } = body;

  if (!companyName) {
    return NextResponse.json({ error: "companyName is required" }, { status: 400 });
  }

  const config = await routeByTaskType("research", userSettings ?? null);

  const system = `You are a senior sales qualification expert trained in BANT and MEDDIC. Return JSON with: bantScore (0-100), budget, authority, need, timeline, meddicScore (0-100), metrics, economicBuyer, decisionCriteria, decisionProcess, identifiedPain, champion, overallScore (0-100), recommendation ("pursue"|"nurture"|"disqualify"), reasoning. Return ONLY valid JSON.`;
  const user = `Qualify this opportunity:
Company: ${companyName} (${companySize || "unknown size"}, ${revenue || "unknown revenue"})
Pain points: ${(painPoints || []).join("; ")}
Growth signals: ${(growthSignals || []).join("; ")}
Decision makers: ${(decisionMakers || []).join(", ")}
Our product: ${ourProduct || "technology solution"}
Our value prop: ${ourValueProp || "improved efficiency and ROI"}`;

  const raw = await callLLM(system, user, config.maxTokens, config);
  const score = parseJSON<OpportunityScore>(raw);

  return NextResponse.json(score);
}
