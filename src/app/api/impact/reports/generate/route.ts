import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateImpactReport } from "@/lib/agents/impactAnalystAgent";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { period, year } = await req.json();
  if (!period || !year) return NextResponse.json({ error: "period and year required" }, { status: 400 });

  const narrative = await generateImpactReport(session.user.id, period, parseInt(year));

  return NextResponse.json({ narrative });
}
