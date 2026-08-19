export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/adminAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId, admin } = auth;

  const { id: channelId, msgId } = await params;
  const { action, userNote } = await req.json(); // action: "approved" | "rejected"

  // Verify channel belongs to user
  if (!admin) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel || (channel.userId && channel.userId !== userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const msg = await prisma.channelMessage.findUnique({ where: { id: msgId } });
  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const updated = await prisma.channelMessage.update({
    where: { id: msgId },
    data: { approvalStatus: action === "approved" ? "approved" : "rejected" },
  });

  // Mirror to PendingApprovals for history
  if (msg.payload && msg.actionType) {
    await prisma.pendingApproval.create({
      data: {
        userId,
        agentId: msg.senderId,
        agentName: msg.senderName,
        actionType: msg.actionType,
        title: `Channel draft — ${msg.actionType.replace("_", " ")}`,
        description: msg.content,
        payload: msg.payload,
        status: action === "approved" ? "approved" : "rejected",
        userNote: userNote ?? null,
        decidedAt: new Date(),
      },
    });
  }

  return NextResponse.json(updated);
}
