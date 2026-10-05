export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { runMarketingCampaign } from "@/lib/agents/marketingFrameworkAgent";
import type { CampaignInput, MarketingFramework } from "@/lib/agents/marketingFrameworkAgent";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const input: CampaignInput = {
    orgName: body.orgName,
    mission: body.mission,
    audience: body.audience,
    goal: body.goal,
    channel: body.channel || "multi-channel",
    tone: body.tone,
    focusAreas: body.focusAreas,
  };

  const frameworks: MarketingFramework[] = body.frameworks || ["ALL"];
  const userSettings = body.userSettings ?? null;

  if (!input.orgName || !input.mission || !input.audience || !input.goal) {
    return NextResponse.json({ error: "orgName, mission, audience, and goal are required" }, { status: 400 });
  }

  const campaign = await runMarketingCampaign(input, frameworks, userSettings);

  await prisma.agentRun.create({
    data: {
      agentId: "marketingFrameworkAgent",
      agentName: "marketingFrameworkAgent",
      status: "success",
      output: `Marketing campaign generated for ${input.orgName}: ${frameworks.join(", ")} frameworks`,
    },
  });

  return NextResponse.json(campaign);
}
