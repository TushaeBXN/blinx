import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const metrics = await prisma.impactMetric.findMany({
    where: { userId: session.user.id },
    orderBy: [{ year: "desc" }, { period: "asc" }],
  });

  return NextResponse.json(metrics);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, unit, value, period, year, notes } = body;

  const existing = await prisma.impactMetric.findFirst({
    where: { userId: session.user.id, name, period, year: parseInt(year) },
  });

  if (existing) {
    const updated = await prisma.impactMetric.update({
      where: { id: existing.id },
      data: { value: parseFloat(value), notes, updatedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.impactMetric.create({
    data: {
      userId: session.user.id,
      name,
      unit,
      value: parseFloat(value),
      period,
      year: parseInt(year),
      notes,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
