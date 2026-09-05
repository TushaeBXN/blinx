/**
 * Marketing Agent — multi-discipline AI marketing staff
 *
 * Routes tasks across four frameworks adapted from the Aaron Marketing Skills system:
 *   TALE  — Narrative  (Trace → Architect → Land → Evaluate)
 *   ECHO  — Social     (Explore → Craft → Host → Observe)
 *   SEND  — Email      (Setup → Engage → Nurture → Deliver)
 *   RAMP  — Launch     (Research → Assemble → Mobilize → Prove)
 *
 * Every output goes to the approval queue. Nothing is ever auto-posted or auto-sent.
 */

import { callLLM, parseJSON } from "@/lib/llm";
import { prisma } from "@/lib/prisma";

// ── Output types ──────────────────────────────────────────────────────────────

export interface SocialOutput {
  taskType: "social";
  xPost: string;              // ≤280 chars
  linkedInPost: string;
  instagramCaption: string;
  hashtags: string[];
  videoScriptHook?: string;   // ≤15-second hook for short-form video (Reels/TikTok)
  bestTime: string;           // recommended post time ISO string
}

export interface EmailOutput {
  taskType: "email";
  subject: string;
  preheader: string;
  body: string;               // plain text, ready to paste into any email tool
  cta: string;
  segment: string;            // who should receive this
  sendNotes: string;          // deliverability / timing notes
}

export interface NarrativeOutput {
  taskType: "narrative";
  positioningStatement: string;   // one crisp sentence
  coreMessage: string;            // 2–3 sentence brand story
  messagePillars: string[];       // 3 repeatable proof themes
  voiceGuidance: string;          // tone and word choices
  proofPoints: string[];          // 3 concrete evidence statements
  channelAdaptations: {
    funder: string;
    school: string;
    community: string;
  };
}

export interface LaunchOutput {
  taskType: "launch";
  campaignName: string;
  hook: string;                   // one-line campaign hook
  channels: string[];
  phases: { week: string; action: string }[];
  successMetrics: string[];
  draftAnnouncement: string;      // ready-to-use announcement copy
}

export type MarketingOutput = SocialOutput | EmailOutput | NarrativeOutput | LaunchOutput;

// ── Task detection ────────────────────────────────────────────────────────────

type MarketingTaskType = "social" | "email" | "narrative" | "launch";

function detectTaskType(task: string): MarketingTaskType {
  const t = task.toLowerCase();
  if (/email|newsletter|outreach|funder\s+letter|donor|subject\s+line|inbox/.test(t)) return "email";
  if (/story|narrative|brand|position|message|voice|mission|identity|who\s+we\s+are/.test(t)) return "narrative";
  if (/launch|event|conference|e-conference|cohort|program|campaign|announce|kickoff/.test(t)) return "launch";
  return "social";
}

// ── Framework prompts ─────────────────────────────────────────────────────────

async function getOrgContext(userId?: string): Promise<string> {
  if (!userId) return "Aim Higher in Education, Inc. (AHIE) — education coaching nonprofit in Winston-Salem, NC. Coaches educators, facilitates e-conferences, captures community voices through 3-Minute Reels. Mission: education shaped by communities, guided by research, grounded in lived experience.";
  try {
    const org = await prisma.orgProfile.findFirst({ where: { userId } });
    if (org) return `${org.orgName} — ${org.mission} Location: ${org.location}. Focus: ${org.focusAreas}.`;
  } catch { /* fall through */ }
  return "Aim Higher in Education, Inc. (AHIE) — education coaching nonprofit in Winston-Salem, NC.";
}

// ECHO Framework — Social Content
async function runSocialFramework(task: string, orgContext: string): Promise<SocialOutput> {
  const tomorrow9am = new Date();
  tomorrow9am.setDate(tomorrow9am.getDate() + 1);
  tomorrow9am.setHours(9, 0, 0, 0);

  const raw = await callLLM(
    `You are a nonprofit social media strategist applying the ECHO framework (Explore platform norms → Craft content → quality check).

ORG CONTEXT: ${orgContext}

Rules:
- X post: ≤280 chars, no filler, strong hook in first 8 words
- LinkedIn: professional but warm, 150–300 words, end with a question or CTA
- Instagram: visual-first, 100–150 words, storytelling tone, speaks to educators/community
- Hashtags: 5–8 relevant tags, mix of reach (#Education) and niche (#WinstonSalem #EducationEquity)
- Video hook: ≤15-second spoken hook for a 3-Minute Reel — designed to stop the scroll
- Never use generic nonprofit filler ("We are excited to announce...")
- Every post must reflect lived experience, community trust, long-term change

Return JSON only — no prose before or after:
{
  "xPost": "string ≤280 chars",
  "linkedInPost": "string",
  "instagramCaption": "string",
  "hashtags": ["tag1","tag2"],
  "videoScriptHook": "string — 15-second spoken hook",
  "bestTime": "ISO string"
}`,
    `Task: ${task}\nScheduled time: ${tomorrow9am.toISOString()}`,
    1200,
    { taskType: "social_content" }
  );

  const parsed = parseJSON<Omit<SocialOutput, "taskType">>(raw);
  return { taskType: "social", ...parsed, bestTime: parsed.bestTime || tomorrow9am.toISOString() };
}

// SEND Framework — Email
async function runEmailFramework(task: string, orgContext: string): Promise<EmailOutput> {
  const raw = await callLLM(
    `You are a nonprofit email strategist applying the SEND framework (Setup → Engage → Nurture → Deliver).

ORG CONTEXT: ${orgContext}

Rules for the email:
- Subject: ≤50 chars, specific and curiosity-driven, no spam triggers ("FREE", "!!!", all-caps)
- Preheader: ≤90 chars, extends subject without repeating it
- Body: plain text, warm and direct, 150–250 words. Lead with the human story, support with one data point, close with one clear ask.
- CTA: single specific action (not "click here" — tell them exactly what happens)
- Segment: who receives this (funders, school partners, community members, board)
- Send notes: best day/time, any deliverability notes

Return JSON only:
{
  "subject": "string",
  "preheader": "string",
  "body": "string",
  "cta": "string",
  "segment": "string",
  "sendNotes": "string"
}`,
    `Task: ${task}`,
    1000,
    { taskType: "writing" }
  );

  const parsed = parseJSON<Omit<EmailOutput, "taskType">>(raw);
  return { taskType: "email", ...parsed };
}

// TALE Framework — Brand Narrative
async function runNarrativeFramework(task: string, orgContext: string): Promise<NarrativeOutput> {
  const raw = await callLLM(
    `You are a nonprofit brand strategist applying the TALE framework (Trace the honest story → Architect the canon → Land it into channels → Evaluate truth).

ORG CONTEXT: ${orgContext}

Deliver a complete narrative package. Every claim must be traceable to real work. No aspirational filler.

Return JSON only:
{
  "positioningStatement": "one sentence — who you are, for whom, and what changes because of you",
  "coreMessage": "2–3 sentences — the brand story arc: the problem, the approach, the outcome",
  "messagePillars": ["pillar1", "pillar2", "pillar3"],
  "voiceGuidance": "tone rules and specific words to use/avoid",
  "proofPoints": ["concrete evidence 1", "concrete evidence 2", "concrete evidence 3"],
  "channelAdaptations": {
    "funder": "how to frame the message for a grant funder",
    "school": "how to frame for a school district or principal",
    "community": "how to frame for community members and caregivers"
  }
}`,
    `Task: ${task}`,
    1400,
    { taskType: "writing" }
  );

  const parsed = parseJSON<Omit<NarrativeOutput, "taskType">>(raw);
  return { taskType: "narrative", ...parsed };
}

// RAMP Framework — Campaign Launch
async function runLaunchFramework(task: string, orgContext: string): Promise<LaunchOutput> {
  const raw = await callLLM(
    `You are a nonprofit campaign strategist applying the RAMP framework (Research → Assemble assets → Mobilize → Prove outcomes).

ORG CONTEXT: ${orgContext}

Build a realistic, executable launch plan for a nonprofit with one staff member and limited budget. Every phase must be actionable in under 2 hours/week.

Return JSON only:
{
  "campaignName": "string",
  "hook": "one-line campaign hook — the reason someone stops and pays attention",
  "channels": ["channel1", "channel2"],
  "phases": [
    {"week": "Week 1", "action": "string"},
    {"week": "Week 2", "action": "string"},
    {"week": "Week 3", "action": "string"},
    {"week": "Launch Week", "action": "string"}
  ],
  "successMetrics": ["metric1", "metric2", "metric3"],
  "draftAnnouncement": "ready-to-use announcement — 100 words, can be posted as-is"
}`,
    `Task: ${task}`,
    1200,
    { taskType: "writing" }
  );

  const parsed = parseJSON<Omit<LaunchOutput, "taskType">>(raw);
  return { taskType: "launch", ...parsed };
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function runMarketingAgent(
  delegatedTask: string,
  userId?: string
): Promise<MarketingOutput> {
  const taskType = detectTaskType(delegatedTask);
  const orgContext = await getOrgContext(userId);

  let output: MarketingOutput;
  let status = "success";
  let rawStr = "";

  try {
    switch (taskType) {
      case "social":    output = await runSocialFramework(delegatedTask, orgContext); break;
      case "email":     output = await runEmailFramework(delegatedTask, orgContext); break;
      case "narrative": output = await runNarrativeFramework(delegatedTask, orgContext); break;
      case "launch":    output = await runLaunchFramework(delegatedTask, orgContext); break;
    }
    rawStr = JSON.stringify(output);
  } catch (err) {
    status = "error";
    rawStr = String(err);
    // Safe fallback for social
    const tomorrow9am = new Date();
    tomorrow9am.setDate(tomorrow9am.getDate() + 1);
    tomorrow9am.setHours(9, 0, 0, 0);
    output = {
      taskType: "social",
      xPost: "Education shaped by community, guided by research. That's our work. #AHIE #Education",
      linkedInPost: "At Aim Higher in Education, we believe the people closest to the problem are closest to the solution. Our coaching work starts by listening.",
      instagramCaption: "Real talk on education — from the people living it. Watch our latest 3-Minute Reel. Link in bio.",
      hashtags: ["#Education", "#WinstonSalem", "#EquityInEducation", "#AHIE", "#CommunityFirst"],
      bestTime: tomorrow9am.toISOString(),
    };
  }

  const actionLabels: Record<MarketingTaskType, string> = {
    social: "social media content",
    email: "email draft",
    narrative: "brand narrative package",
    launch: "campaign launch plan",
  };

  await prisma.agentRun.create({
    data: { agentId: "marketingAgent", agentName: "Marketing Agent", status, output: rawStr },
  });

  await prisma.pendingApproval.create({
    data: {
      agentId: "marketingAgent",
      agentName: "Marketing Agent",
      actionType: "social_post",
      title: `Review ${actionLabels[taskType]} before publishing`,
      description: delegatedTask,
      payload: rawStr,
    },
  });

  await prisma.activityLog.create({
    data: {
      agentId: "marketingAgent",
      label: `Marketing drafted ${actionLabels[taskType]} — waiting for your approval`,
    },
  });

  return output;
}
