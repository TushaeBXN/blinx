export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { runSalesProspect } from "@/lib/agents/salesAgent";
import type { ProspectInput } from "@/lib/agents/salesAgent";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const prospect: ProspectInput = {
    companyName: body.companyName,
    website: body.website,
    industry: body.industry,
    targetRole: body.targetRole,
    ourProduct: body.ourProduct,
    ourValueProp: body.ourValueProp,
  };

  if (!prospect.companyName) {
    return NextResponse.json({ error: "companyName is required" }, { status: 400 });
  }

  const userSettings = body.userSettings ?? null;
  const report = await runSalesProspect(prospect, userSettings);

  await prisma.agentRun.create({
    data: {
      agentId: "salesProspectAgent",
      agentName: "salesProspectAgent",
      status: "success",
      output: JSON.stringify({
        company: report.company.name,
        score: report.opportunity.overallScore,
        recommendation: report.opportunity.recommendation,
      }),
    },
  });

  return NextResponse.json(report);
}
