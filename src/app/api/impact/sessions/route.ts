import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.engagementSession.findMany({
    where: { userId: session.user.id },
    include: { feedback: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, type, date, organization, participantCount, topic, notes, status } = body;

  const created = await prisma.engagementSession.create({
    data: {
      userId: session.user.id,
      title,
      type,
      date: new Date(date),
      organization,
      participantCount: parseInt(participantCount) || 0,
      topic,
      notes,
      status: status || "completed",
    },
  });

  await prisma.activityLog.create({
    data: { agentId: "system", label: `Session logged: "${title}" — ${participantCount} participants at ${organization}` },
  });

  return NextResponse.json(created, { status: 201 });
}
