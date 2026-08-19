export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { agentLearnFromApproval, agentLearnFromRejection, orgSlug } from "@/lib/engram";
import { requireAuth } from "@/lib/adminAuth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId, admin } = auth;

  const { id } = await params;
  const { action, userNote } = await req.json();

  // Verify ownership — admin can act on any approval
  const existing = await prisma.pendingApproval.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!admin && existing.userId && existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const approval = await prisma.pendingApproval.update({
    where: { id },
    data: { status: action, userNote: userNote ?? null, decidedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      agentId: approval.agentId,
      userId,
      label: `"${approval.title}" — ${action === "approved" ? "✓ Approved" : "✗ Rejected"}${userNote ? `: ${userNote}` : ""}`,
    },
  });

  const wing = orgSlug("Runway Tech Education Nonprofit");
  if (action === "approved") {
    await agentLearnFromApproval({ wing, agentId: approval.agentId, actionType: approval.actionType, summary: `${approval.title} — ${approval.description}` });
  } else {
    await agentLearnFromRejection({ wing, agentId: approval.agentId, actionType: approval.actionType, summary: `${approval.title} — ${approval.description}`, userNote: userNote ?? undefined });
  }

  return NextResponse.json({ ok: true });
}
