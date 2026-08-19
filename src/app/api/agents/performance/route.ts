export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const { agentId, status, durationMs, errorMsg } = await req.json();
  await prisma.agentPerformance.create({
    data: { agentId, status, durationMs: durationMs ?? null, errorMsg: errorMsg ?? null },
  });

  const recent = await prisma.agentPerformance.findMany({
    where: { agentId },
    orderBy: { ranAt: "desc" },
    take: 5,
  });

  if (recent.length >= 5 && recent.every((r) => r.status === "error")) {
    const agent = await prisma.agentDefinition.findUnique({ where: { agentId } });
    if (agent && agent.status === "active" && !agent.isBuiltIn) {
      await prisma.agentDefinition.update({
        where: { agentId },
        data: { status: "probation" },
      });
      await prisma.activityLog.create({
        data: {
          agentId,
          userId,
          label: `⚠️ ${agent.name} placed on probation — 5 consecutive errors`,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
