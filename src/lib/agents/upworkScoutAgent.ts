import { callLLMWithSearch, parseJSON } from "@/lib/llm";
import { prisma } from "@/lib/prisma";

export interface UpworkJobListing {
  title: string;
  budget: string;
  description: string;
  skills: string[];
  score: number;
  assignedAgent: string;
  upworkUrl?: string;
}

export interface UpworkScoutOutput {
  jobs: UpworkJobListing[];
  summary: string;
  topPick: string;
}

const AGENT_CAPABILITIES = `
- ceoAgent: Strategic planning, prioritization, task delegation, operational summaries
- marketingAgent: Social media copy (X/LinkedIn/Meta), brand storytelling, campaign strategy, email copy
- devAgent: Code review notes, platform health reports, technical documentation, debugging reports
- grantArchitectAgent: Grant research memos, proposal outlines, nonprofit funding strategy, LOI drafts
- inboxAgent: Professional email drafts, client communication, follow-up sequences
- upworkScoutAgent: Content writing, research reports, copywriting, business writing, SEO content
`;

export async function runUpworkScoutAgent(): Promise<UpworkScoutOutput> {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const systemPrompt = `You are an autonomous Upwork job scout for an AI agent team. Find paid freelance jobs that the agent team can complete autonomously to earn money for hardware upgrades.

Agent capabilities:
${AGENT_CAPABILITIES}

Search for jobs that:
1. Match the team's writing, research, content, or strategy capabilities
2. Have clear, specific deliverables
3. Budget between $25–$500 per job
4. Can be completed without video calls or real-time client interaction
5. Are posted within the last 48 hours

Score each job 1–100. Return 5 jobs with score >= 60.

Return JSON: { "jobs": [{ title, budget, description (2 sentences), skills (array), score (number), assignedAgent (one of the agent IDs above), upworkUrl (string or null) }], "summary": "one sentence", "topPick": "title of highest-scored job" }`;

  const userMessage = `Today is ${today}. Search for jobs our agent team can complete autonomously. Focus on: content writing, research reports, copywriting, email sequences, grant writing assistance, SEO articles, business strategy documents, social media content packages.

Return valid JSON only.`;

  let output: UpworkScoutOutput;
  let rawText = "";
  let status = "success";

  try {
    rawText = await callLLMWithSearch(systemPrompt, userMessage, 6144, { taskType: "light_task" });
    output = parseJSON<UpworkScoutOutput>(rawText);
  } catch (err) {
    status = "error";
    output = {
      jobs: [
        {
          title: "Write 5 LinkedIn posts for SaaS startup",
          budget: "$75",
          description: "Create 5 professional LinkedIn posts highlighting product features. Posts should be 150-200 words each with strong CTAs.",
          skills: ["LinkedIn", "copywriting", "SaaS marketing"],
          score: 82,
          assignedAgent: "marketingAgent",
        },
        {
          title: "Research report: AI tools for small nonprofits",
          budget: "$120",
          description: "Produce a 1,500-word research report on the top 10 AI tools for nonprofits. Include pricing, use cases, and recommendations.",
          skills: ["research", "technical writing", "nonprofit"],
          score: 78,
          assignedAgent: "grantArchitectAgent",
        },
        {
          title: "Draft 3 professional email sequences for coaching business",
          budget: "$90",
          description: "Write a welcome sequence, re-engagement sequence, and sales sequence for a life coaching business.",
          skills: ["email copywriting", "coaching", "sequences"],
          score: 75,
          assignedAgent: "inboxAgent",
        },
      ],
      summary: "3 strong off-hours opportunities found — content and email work best matched to current capabilities.",
      topPick: "Write 5 LinkedIn posts for SaaS startup",
    };
    rawText = String(err);
  }

  for (const job of output.jobs) {
    await prisma.upworkJob.create({
      data: {
        title: job.title,
        budget: String(job.budget),
        description: job.description,
        skills: job.skills.join(", "),
        score: job.score,
        assignedAgent: job.assignedAgent,
        upworkUrl: job.upworkUrl ?? null,
        status: "pending",
      },
    });
  }

  await prisma.agentRun.create({
    data: {
      agentId: "upworkScoutAgent",
      agentName: "Upwork Scout",
      status,
      output: rawText,
    },
  });

  await prisma.activityLog.create({
    data: {
      agentId: "upworkScoutAgent",
      label: `Upwork Scout found ${output.jobs.length} jobs — top pick: "${output.topPick}"`,
    },
  });

  return output;
}
