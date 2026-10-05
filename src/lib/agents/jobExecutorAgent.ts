import { callLLM, parseJSON } from "@/lib/llm";
import { prisma } from "@/lib/prisma";

export interface JobExecutorOutput {
  jobId: string;
  title: string;
  deliverable: string;
  status: "completed" | "failed";
  estimatedEarnings: number;
}

function getTier(totalEarned: number): string {
  if (totalEarned >= 7798) return "tier3";
  if (totalEarned >= 3099) return "tier2";
  if (totalEarned >= 1599) return "tier1";
  return "tier0";
}

export async function runJobExecutorAgent(): Promise<JobExecutorOutput[]> {
  const pendingJobs = await prisma.upworkJob.findMany({
    where: { status: "pending", score: { gte: 70 } },
    orderBy: { score: "desc" },
    take: 3,
  });

  if (pendingJobs.length === 0) {
    await prisma.activityLog.create({
      data: {
        agentId: "jobExecutorAgent",
        label: "Job Executor: no qualifying jobs in queue — skipping execution",
      },
    });
    return [];
  }

  const results: JobExecutorOutput[] = [];

  for (const job of pendingJobs) {
    await prisma.upworkJob.update({
      where: { id: job.id },
      data: { status: "in_progress" },
    });

    const systemPrompt = `You are a professional freelancer completing a paid Upwork job. Produce a complete, polished, client-ready deliverable. No placeholders. No "TODO" items. Every section must be fully written.

The deliverable must:
- Be immediately usable by the client without any editing
- Match the word count and format specified in the job description
- Be professional and publication-ready
- End with: "Delivered by Blinx AI — Questions? Reply to this message."`;

    const userMessage = `Complete this Upwork job in full:

JOB TITLE: ${job.title}
BUDGET: ${job.budget}
REQUIRED SKILLS: ${job.skills}
JOB DESCRIPTION: ${job.description}

Produce the complete, client-ready deliverable now. Return JSON: { "deliverable": "full completed work as formatted string", "status": "completed" }`;

    let deliverable = "";
    let jobStatus: "completed" | "failed" = "failed";
    let rawText = "";

    try {
      rawText = await callLLM(systemPrompt, userMessage, 4096, { taskType: "coding" });
      const parsed = parseJSON<{ deliverable: string; status: string }>(rawText);
      deliverable = parsed.deliverable || rawText;
      jobStatus = "completed";
    } catch {
      deliverable = `Job execution failed for: ${job.title}`;
      jobStatus = "failed";
    }

    const earningsMatch = job.budget.replace(/,/g, "").match(/\$?([\d.]+)/);
    const estimatedEarnings = earningsMatch ? parseFloat(earningsMatch[1] ?? "0") : 0;

    await prisma.upworkJob.update({
      where: { id: job.id },
      data: { status: jobStatus, deliverable, earnings: jobStatus === "completed" ? estimatedEarnings : 0 },
    });

    if (jobStatus === "completed" && estimatedEarnings > 0) {
      const existing = await prisma.hardwareFund.findFirst();
      if (existing) {
        const newTotal = existing.totalEarned + estimatedEarnings;
        await prisma.hardwareFund.update({
          where: { id: existing.id },
          data: { totalEarned: newTotal, currentTier: getTier(newTotal), updatedAt: new Date() },
        });
      } else {
        await prisma.hardwareFund.create({
          data: { totalEarned: estimatedEarnings, currentTier: getTier(estimatedEarnings) },
        });
      }
    }

    if (jobStatus === "completed") {
      await prisma.pendingApproval.create({
        data: {
          agentId: "jobExecutorAgent",
          agentName: "Job Executor",
          actionType: "job_deliverable",
          title: `Review deliverable before submitting: "${job.title}"`,
          description: `Budget: ${job.budget} · Skills: ${job.skills}`,
          payload: JSON.stringify({ title: job.title, budget: job.budget, deliverable }),
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        agentId: "jobExecutorAgent",
        label: `Job Executor: "${job.title}" — ${jobStatus === "completed" ? "ready for your review" : "failed"}`,
      },
    });

    results.push({ jobId: job.id, title: job.title, deliverable, status: jobStatus, estimatedEarnings });
  }

  await prisma.agentRun.create({
    data: {
      agentId: "jobExecutorAgent",
      agentName: "Job Executor",
      status: results.some((r) => r.status === "completed") ? "success" : "error",
      output: JSON.stringify(results),
    },
  });

  return results;
}
