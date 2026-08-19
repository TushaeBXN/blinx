export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { runNightlyLoop } from "@/lib/scheduler";
import { requireAuth } from "@/lib/adminAuth";

export async function POST() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  void userId; // scheduler multi-user refactor pending
  runNightlyLoop().catch((err) =>
    console.error("[Runway] Manual run error:", err)
  );
  return NextResponse.json({ status: "started" });
}
