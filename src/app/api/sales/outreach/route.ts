export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { callLLM, parseJSON } from "@/lib/llm";
import { routeByTaskType } from "@/lib/modelRouter";
import type { OutreachSequence } from "@/lib/agents/salesAgent";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyName, contactTitle, identifiedPain, ourValueProp, ourAdvantage, recentNews, userSettings } = body;

  if (!companyName) {
    return NextResponse.json({ error: "companyName is required" }, { status: 400 });
  }

  const config = await routeByTaskType("email_draft", userSettings ?? null);

  const system = `You are an elite B2B sales copywriter specializing in personalized outreach. Return JSON with: subject, email1 (100-150 words), linkedin1 (50 words max), email2 (80-100 words), callScript (30-second opener), email3 (60 words), keyHooks (array of 3). Return ONLY valid JSON.`;
  const user = `Write a personalized 6-touch outreach sequence for:
Contact: ${contactTitle || "Decision Maker"} at ${companyName}
Their pain: ${identifiedPain || "operational inefficiency"}
Our angle: ${ourValueProp || "drive measurable ROI"}
Key differentiator: ${ourAdvantage || "superior solution"}
Recent news: ${recentNews || "company growth"}`;

  const raw = await callLLM(system, user, config.maxTokens, config);
  const sequence = parseJSON<OutreachSequence>(raw);

  return NextResponse.json(sequence);
}
