/**
 * Consensus memory — cross-cycle handoff state for the expert council.
 * Stored as a special AgentRun record (agentName: "consensusMemory").
 */

import { prisma } from "@/lib/prisma";

export interface ConsensusState {
  currentFocus: string;
  nextAction: string;
  lastWorkflow: string;
  completedCycles: number;
  lastSquad: string[];
  keyDecisions: Array<{
    question: string;
    recommendation: string;
    confidence: number;
    date: string;
  }>;
  openRisks: string[];
  updatedAt: string;
}

export async function readConsensus(): Promise<ConsensusState | null> {
  try {
    const run = await prisma.agentRun.findFirst({
      where: { agentName: "consensusMemory" },
      orderBy: { ranAt: "desc" },
    });
    if (!run) return null;
    return JSON.parse(run.output) as ConsensusState;
  } catch {
    return null;
  }
}

export async function updateConsensusFromRun(
  question: string,
  recommendation: string,
  confidence: number,
  squad: string[],
  workflow?: string,
  risks?: string[],
  nextAction?: string,
): Promise<void> {
  const existing = await readConsensus();

  const newDecision = {
    question,
    recommendation,
    confidence,
    date: new Date().toISOString(),
  };

  const state: ConsensusState = {
    currentFocus: question,
    nextAction: nextAction ?? "Review council output and decide next focus",
    lastWorkflow: workflow ?? "manual",
    completedCycles: (existing?.completedCycles ?? 0) + 1,
    lastSquad: squad,
    keyDecisions: [newDecision, ...(existing?.keyDecisions ?? [])].slice(0, 20),
    openRisks: risks ?? existing?.openRisks ?? [],
    updatedAt: new Date().toISOString(),
  };

  try {
    await prisma.agentRun.create({
      data: {
        agentId: "consensusMemory",
        agentName: "consensusMemory",
        status: "success",
        output: JSON.stringify(state),
      },
    });
  } catch {
    // Best-effort
  }
}
