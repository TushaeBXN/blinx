export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { runOffHoursLoop } from "@/lib/scheduler";
import { requireAuth } from "@/lib/adminAuth";

export async function POST() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  void userId; // scheduler multi-user refactor pending
  runOffHoursLoop().catch((err) =>
    console.error("[Runway] Manual off-hours run error:", err)
  );
  return NextResponse.json({ status: "started" });
}
