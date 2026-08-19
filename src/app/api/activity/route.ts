export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, userOrSystemFilter } from "@/lib/adminAuth";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId, admin } = auth;

  const logs = await prisma.activityLog.findMany({
    where: userOrSystemFilter(userId, admin),
    take: 50,
    orderBy: { time: "desc" },
  });
  return NextResponse.json(logs);
}
