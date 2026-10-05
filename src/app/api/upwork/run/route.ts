export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { runNightlyLoop } from "@/lib/scheduler";

export async function POST() {
  runNightlyLoop().catch((err: unknown) =>
    console.error("[Blinx] Manual off-hours run error:", err)
  );
  return NextResponse.json({ status: "started" });
}
