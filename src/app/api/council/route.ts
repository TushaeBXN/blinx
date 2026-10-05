export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import {
  runExpertCouncil,
  runPreMortem,
  COUNCIL_PERSONAS,
  STANDARD_WORKFLOWS,
} from "@/lib/agents/councilAgent";
import type { WorkflowType } from "@/lib/agents/councilAgent";
import { updateConsensusFromRun, readConsensus } from "@/lib/consensusMemory";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { question, context, personaIds, workflow, runPreMortem: doPreMortem, premortemOnly, plan, userSettings } = body;

  if (!question && !plan) {
    return NextResponse.json({ error: "question (or plan for premortemOnly) is required" }, { status: 400 });
  }

  if (premortemOnly && plan) {
    const result = await runPreMortem(plan, context || "", userSettings ?? null);
    return NextResponse.json(result);
  }

  const consensus = await runExpertCouncil(question, context || "", {
    personaIds,
    workflow: workflow as WorkflowType | undefined,
    runPreMortem: doPreMortem,
    userSettings: userSettings ?? null,
  });

  await Promise.allSettled([
    prisma.agentRun.create({
      data: {
        agentId: "councilAgent",
        agentName: "councilAgent",
        status: "success",
        output: `Squad: ${consensus.squad.map((s) => s.name).join(", ")}. Confidence: ${consensus.confidenceScore}%. ${consensus.finalRecommendation.slice(0, 200)}`,
      },
    }),
    updateConsensusFromRun(
      question,
      consensus.finalRecommendation,
      consensus.confidenceScore,
      consensus.squad.map((s) => s.name),
      workflow,
      consensus.risks,
    ),
  ]);

  return NextResponse.json(consensus);
}

export async function GET() {
  const [consensus] = await Promise.allSettled([readConsensus()]);

  return NextResponse.json({
    personas: COUNCIL_PERSONAS.map((p) => ({
      id: p.id,
      name: p.name,
      layer: p.layer,
      archetype: p.archetype,
      outputDomain: p.outputDomain,
    })),
    workflows: Object.entries(STANDARD_WORKFLOWS).map(([type, agentIds]) => ({
      type,
      squad: agentIds,
      description: ({
        new_product_evaluation: "Research → CEO → Munger → Product → CTO → CFO",
        feature_development: "Interaction → UI → Full-stack → QA → DevOps",
        product_launch: "QA → DevOps → Marketing → Sales → Ops → CEO",
        pricing_monetization: "Research → CFO → Sales → Munger → CEO",
        weekly_review: "Ops → Sales → CFO → QA → CEO",
        opportunity_discovery: "Research → CEO → Munger → CFO",
      } as Record<string, string>)[type] ?? type,
    })),
    consensus: consensus.status === "fulfilled" ? consensus.value : null,
  });
}
