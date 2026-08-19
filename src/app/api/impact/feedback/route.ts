import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  const where = sessionId
    ? { sessionId, session: { userId: session.user.id } }
    : { session: { userId: session.user.id } };

  const feedback = await prisma.sessionFeedback.findMany({
    where,
    include: { session: { select: { title: true, organization: true, date: true } } },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(feedback);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, respondentRole, overallRating, keyLearning, biggestChallenge, wouldRecommend, openFeedback } = body;

  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const created = await prisma.sessionFeedback.create({
    data: {
      sessionId,
      respondentRole: respondentRole || "educator",
      overallRating: parseInt(overallRating) || 3,
      keyLearning,
      biggestChallenge,
      wouldRecommend: wouldRecommend !== false,
      openFeedback,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
