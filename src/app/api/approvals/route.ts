export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, userOrSystemFilter } from "@/lib/adminAuth";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId, admin } = auth;

  const approvals = await prisma.pendingApproval.findMany({
    where: userOrSystemFilter(userId, admin),
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(approvals);
}
