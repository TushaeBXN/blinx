export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, userOrSystemFilter } from "@/lib/adminAuth";

const AGENT_IDS = [
  "ceoAgent",
  "marketingAgent",
  "devAgent",
  "inboxAgent",
  "grantArchitectAgent",
  "upworkScoutAgent",
  "jobExecutorAgent",
  "hardwareFundAgent",
];

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId, admin } = auth;

  const filter = userOrSystemFilter(userId, admin);

  const runs = await Promise.all(
    AGENT_IDS.map((agentId) =>
      prisma.agentRun.findFirst({
        where: { agentId, ...filter },
        orderBy: { ranAt: "desc" },
      })
    )
  );

  return NextResponse.json(
    runs.map((run, i) =>
      run ?? {
        agentId: AGENT_IDS[i],
        agentName: AGENT_IDS[i],
        status: "never_run",
        output: "",
        ranAt: null,
      }
    )
  );
}
