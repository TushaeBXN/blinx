// Gumroad webhook — receives sale events and auto-allocates to Reserve Fund.
// Set in Gumroad dashboard: https://yourdomain.com/api/webhooks/gumroad
// Gumroad sends application/x-www-form-urlencoded POST.

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();
  const f = (key: string) => formData.get(key)?.toString() ?? "";

  const saleId      = f("sale_id");
  const productName = f("product_name");
  const productId   = f("product_id");
  const priceStr    = f("price");       // in cents
  const feeStr      = f("gumroad_fee"); // in cents
  const buyerEmail  = f("email");
  const sellerId    = f("seller_id");

  if (!saleId) return NextResponse.json({ error: "Missing sale_id" }, { status: 400 });

  const amount = parseFloat(priceStr) / 100;
  const fee    = parseFloat(feeStr || "0") / 100;
  const net    = Math.max(0, amount - fee);

  // Find user by their stored Gumroad seller_id
  const service = await prisma.connectedService.findFirst({
    where: { service: "gumroad", isActive: true, credentials: { contains: sellerId } },
  });
  const userId = service?.userId ?? null;

  // Idempotency — skip duplicate webhooks
  const existing = await prisma.gumroadSale.findUnique({ where: { saleId } });
  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  await prisma.gumroadSale.create({
    data: {
      saleId,
      productName,
      productId: productId || null,
      amount,
      fee,
      net,
      email: buyerEmail || null,
      userId: userId ?? "unmatched",
    },
  });

  if (userId) {
    const fund = await prisma.reserveFund.upsert({
      where: { userId },
      update: {},
      create: { userId, label: "Compliance Reserve", balance: 0, targetAmount: 0, autoAllocatePct: 20 },
    });

    const allocPct = fund.autoAllocatePct / 100;
    const allocAmount = Math.round(net * allocPct * 100) / 100;

    if (allocAmount > 0) {
      await Promise.all([
        prisma.reserveFund.update({ where: { userId }, data: { balance: { increment: allocAmount } } }),
        prisma.reserveFundTransaction.create({
          data: {
            userId,
            amount: allocAmount,
            type: "deposit",
            source: "gumroad",
            description: `Auto-allocated ${fund.autoAllocatePct}% of $${net.toFixed(2)} Gumroad sale: ${productName}`,
          },
        }),
      ]);
    }
  }

  return NextResponse.json({ ok: true, saleId, net, userId });
}
