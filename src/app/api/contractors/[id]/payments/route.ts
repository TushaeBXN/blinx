export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalcContractor } from "@/lib/contractorUtils";

const THRESHOLD = 600;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { id: contractorId } = await params;
  const body = await req.json();

  // IDOR guard: verify contractor belongs to session user
  const contractor = await prisma.contractor.findUnique({ where: { id: contractorId } });
  if (!contractor || contractor.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.action === "add_payment") {
    const payment = await prisma.contractorPayment.create({
      data: {
        contractorId,
        userId,
        amount: parseFloat(body.amount),
        paidOn: new Date(body.paidOn),
        description: body.description ?? null,
        method: body.method ?? null,
        reference: body.reference ?? null,
      },
    });

    // Recalculate contractor total + flag
    await recalcContractor(contractorId);
    const contractor = await prisma.contractor.findUnique({
      where: { id: contractorId },
      include: { payments: { orderBy: { paidOn: "desc" } } },
    });

    return NextResponse.json({ ok: true, payment, contractor, thresholdHit: (contractor?.totalPaid ?? 0) >= THRESHOLD });
  }

  if (body.action === "delete_payment") {
    await prisma.contractorPayment.delete({ where: { id: body.paymentId } });
    await recalcContractor(contractorId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
