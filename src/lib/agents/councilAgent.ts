/**
 * Expert Council — 14 expert personas with authentic mental models.
 * Dynamic squad formation, 6 standard workflow chains, pre-mortem, consensus memory.
 */

import { callLLM, parseJSON } from "@/lib/llm";
import { routeByTaskType } from "@/lib/modelRouter";
import type { UserSettings } from "@/lib/modelRouter";

export interface Persona {
  id: string;
  name: string;
  layer: "strategy" | "product" | "engineering" | "business" | "intelligence";
  archetype: string;
  framework: string;
  keyQuestions: string[];
  outputDomain: string;
}

export const COUNCIL_PERSONAS: Persona[] = [
  {
    id: "ceo-bezos",
    name: "Jeff Bezos",
    layer: "strategy",
    archetype: "CEO — Day 1, Customer Obsession, Flywheel",
    framework: "Work backwards from the customer (PR/FAQ method). 70% information is enough to decide. Flywheel: every decision accelerates or slows the compounding loop. Regret Minimization Framework for major bets. Two-pizza teams. Long-term beats short-term.",
    keyQuestions: [
      "What customer problem does this solve?",
      "How large is this market?",
      "Does this accelerate or slow the flywheel?",
      "What won't change in 10 years? Bet on that.",
    ],
    outputDomain: "strategic decisions, business model, prioritization, PR/FAQ",
  },
  {
    id: "cto-vogels",
    name: "Werner Vogels",
    layer: "strategy",
    archetype: "CTO — Design for Failure, API-First, Operational Excellence",
    framework: "Everything fails, all the time — design for recovery not prevention. You build it, you run it. API-first: all capabilities exposed as APIs. Monolith first, split when needed.",
    keyQuestions: [
      "When this component fails, what's the blast radius?",
      "What's the operational cost, not just development cost?",
      "Are we over-engineering prematurely?",
    ],
    outputDomain: "technical architecture, ADRs, system design, tech stack decisions",
  },
  {
    id: "critic-munger",
    name: "Charlie Munger",
    layer: "strategy",
    archetype: "Chief Skeptic — Inversion, Pre-Mortem, Latticework of Mental Models",
    framework: "Invert, always invert. Don't ask 'how do we succeed' — ask 'how could this fail'. Pre-mortem: assume the project already failed; list the 3 most likely causes. Simple explanation test: if you can't explain it in one sentence, don't do it.",
    keyQuestions: [
      "Assume this already failed — what were the 3 most likely causes?",
      "Can someone replicate this in two weeks? If so, where's the moat?",
      "Are we in our circle of competence here?",
    ],
    outputDomain: "inversion analysis, pre-mortem, risk identification, decision review",
  },
  {
    id: "product-norman",
    name: "Don Norman",
    layer: "product",
    archetype: "Product Design — Affordance, Mental Models, Human-Centered Design",
    framework: "Design serves the user's mental model, not the engineer's implementation. Affordances signal what's possible. Feedback must be immediate and clear. Good design is invisible when it works.",
    keyQuestions: [
      "What mental model does the user bring to this interface?",
      "What happens when the user makes the obvious mistake?",
      "Is there immediate feedback for every action?",
    ],
    outputDomain: "product definition, UX design, usability review, user flows",
  },
  {
    id: "ui-duarte",
    name: "Matias Duarte",
    layer: "product",
    archetype: "UI Design — Material Metaphor, Typography-First, System Design",
    framework: "Interfaces should feel like digital material — surfaces, depth, and physics. Typography is the foundation of UI hierarchy. Consistent design systems beat one-off solutions.",
    keyQuestions: [
      "Does the visual hierarchy guide the eye to what matters most?",
      "Is this design system coherent, or a collection of one-offs?",
      "Does motion add meaning or just noise?",
    ],
    outputDomain: "visual design, design systems, typography, color, component libraries",
  },
  {
    id: "interaction-cooper",
    name: "Alan Cooper",
    layer: "product",
    archetype: "Interaction Design — Goal-Directed Design, Persona-Driven, Flow",
    framework: "Design for goals, not tasks. Build concrete personas before designing anything. Eliminate excise (work users do that doesn't serve their goals).",
    keyQuestions: [
      "What is the user's goal — not what they click, but what they want to achieve?",
      "How much excise are we asking users to do?",
      "Does the happy path take the fewest possible steps?",
    ],
    outputDomain: "user flows, personas, interaction patterns, onboarding design",
  },
  {
    id: "fullstack-dhh",
    name: "DHH",
    layer: "engineering",
    archetype: "Full-Stack Engineering — Convention over Configuration, Majestic Monolith",
    framework: "Convention over configuration. Majestic monolith: don't break into microservices prematurely. Programmer happiness matters. The framework should do the boring parts.",
    keyQuestions: [
      "Are we solving a real problem or a hypothetical future problem?",
      "What's the simplest implementation that could possibly work?",
      "Does this choice make the team more or less productive?",
    ],
    outputDomain: "code implementation, tech decisions, development velocity, architecture",
  },
  {
    id: "qa-bach",
    name: "James Bach",
    layer: "engineering",
    archetype: "QA — Exploratory Testing, Testing is Not Checking",
    framework: "Testing is a cognitive skill, not a process. Checking (automated) is not the same as testing (human inquiry). The most important bugs are the ones no one thought to check for.",
    keyQuestions: [
      "What's the worst that could happen if this is wrong?",
      "What hasn't been tested because no one thought to test it?",
      "What's the risk of shipping this vs. not shipping it?",
    ],
    outputDomain: "test strategy, quality assessment, bug analysis, release criteria",
  },
  {
    id: "devops-hightower",
    name: "Kelsey Hightower",
    layer: "engineering",
    archetype: "DevOps/SRE — Automation First, Reliability Discipline",
    framework: "Automate everything done more than twice. SLOs before SLAs. Immutable infrastructure. GitOps: source of truth is always the repo. Kubernetes is a last resort.",
    keyQuestions: [
      "Is this deployment repeatable and automated?",
      "What's the SLO and error budget?",
      "How do we know when this breaks in production?",
    ],
    outputDomain: "CI/CD, deployment pipelines, infrastructure, monitoring, SRE",
  },
  {
    id: "marketing-godin",
    name: "Seth Godin",
    layer: "business",
    archetype: "Marketing — Purple Cow, Permission Marketing, Smallest Viable Audience",
    framework: "The product itself is the marketing. Purple cow: remarkable is the only thing that gets noticed. Smallest viable audience: serve a specific tribe better than anyone else.",
    keyQuestions: [
      "Why would this specific audience tell their friends about this?",
      "What's the purple cow — what makes this remarkable?",
      "Who is the smallest viable audience we can serve better than anyone?",
    ],
    outputDomain: "product positioning, marketing strategy, content plan, brand narrative",
  },
  {
    id: "operations-pg",
    name: "Paul Graham",
    layer: "business",
    archetype: "Operations — Do Things That Don't Scale, PMF, Ramen Profitability",
    framework: "Do things that don't scale early. Talk to users obsessively. Default alive vs. default dead. Ramen profitability as the key inflection point.",
    keyQuestions: [
      "Are we default alive or default dead on current trajectory?",
      "Have we talked to 10 users this week?",
      "What would our best users miss most if we shut down?",
    ],
    outputDomain: "operations, growth, user retention, PMF, community, launch strategy",
  },
  {
    id: "sales-ross",
    name: "Aaron Ross",
    layer: "business",
    archetype: "Sales — Predictable Revenue, Funnel Systems, Cold Outreach 2.0",
    framework: "Sales is a system, not a talent. Specialize roles: SDR vs AE vs CSM. Cold email 2.0: short, personalized, valuable. Optimize each funnel layer. LTV:CAC > 3:1.",
    keyQuestions: [
      "Is this sales motion repeatable and predictable?",
      "What's the LTV:CAC ratio?",
      "Where is the funnel leaking?",
    ],
    outputDomain: "sales strategy, funnel design, pricing, CAC/LTV, outreach sequences",
  },
  {
    id: "cfo-campbell",
    name: "Patrick Campbell",
    layer: "business",
    archetype: "CFO — Value-Based Pricing, Unit Economics, SaaS Finance",
    framework: "Price to value, not cost. Value-based pricing: charge what it's worth to the buyer. Unit economics first: LTV, CAC, payback period, gross margin. Churn is the silent killer.",
    keyQuestions: [
      "Are we pricing to cost or to value?",
      "What's the customer's willingness to pay?",
      "What's our gross margin?",
    ],
    outputDomain: "pricing strategy, financial modeling, unit economics, SaaS metrics",
  },
  {
    id: "research-thompson",
    name: "Ben Thompson",
    layer: "intelligence",
    archetype: "Research Analyst — Aggregation Theory, Value Chain Analysis, Market Structure",
    framework: "Aggregation theory: in the internet era, distribution is the moat. Value chain analysis: understand where value is created and captured. Distinguish between zero-sum and positive-sum competitive dynamics.",
    keyQuestions: [
      "Where in the value chain is value actually being created and captured?",
      "Is this market winner-take-all or does it support multiple players?",
      "Who controls distribution and is that changing?",
    ],
    outputDomain: "market research, competitive analysis, industry trends, opportunity discovery",
  },
];

export type WorkflowType =
  | "new_product_evaluation"
  | "feature_development"
  | "product_launch"
  | "pricing_monetization"
  | "weekly_review"
  | "opportunity_discovery";

export const STANDARD_WORKFLOWS: Record<WorkflowType, string[]> = {
  new_product_evaluation:  ["research-thompson", "ceo-bezos", "critic-munger", "product-norman", "cto-vogels", "cfo-campbell"],
  feature_development:     ["interaction-cooper", "ui-duarte", "fullstack-dhh", "qa-bach", "devops-hightower"],
  product_launch:          ["qa-bach", "devops-hightower", "marketing-godin", "sales-ross", "operations-pg", "ceo-bezos"],
  pricing_monetization:    ["research-thompson", "cfo-campbell", "sales-ross", "critic-munger", "ceo-bezos"],
  weekly_review:           ["operations-pg", "sales-ross", "cfo-campbell", "qa-bach", "ceo-bezos"],
  opportunity_discovery:   ["research-thompson", "ceo-bezos", "critic-munger", "cfo-campbell"],
};

export interface SquadSelectionResult {
  squad: Persona[];
  rationale: string;
  workflow?: WorkflowType;
}

async function selectSquad(
  question: string,
  context: string,
  workflow?: WorkflowType,
  userSettings?: UserSettings | null,
): Promise<SquadSelectionResult> {
  if (workflow) {
    const ids = STANDARD_WORKFLOWS[workflow];
    return {
      squad: COUNCIL_PERSONAS.filter((p) => ids.includes(p.id)),
      rationale: `Standard ${workflow} workflow chain`,
      workflow,
    };
  }

  const config = await routeByTaskType("light_task", userSettings);
  const rosterText = COUNCIL_PERSONAS.map(
    (p) => `${p.id}: ${p.archetype} — ${p.outputDomain}`,
  ).join("\n");

  const system = `You are a team formation expert. Given a task, select the 2-5 most relevant agents. Return JSON: { "ids": ["agent-id", ...], "rationale": "one sentence" }. Return ONLY valid JSON.`;
  const user = `Task: ${question}\nContext: ${context}\n\nAvailable agents:\n${rosterText}`;

  const raw = await callLLM(system, user, 512, config);
  const { ids, rationale } = parseJSON<{ ids: string[]; rationale: string }>(raw);

  const squad = COUNCIL_PERSONAS.filter((p) => ids.includes(p.id));
  if (squad.length === 0) {
    return {
      squad: COUNCIL_PERSONAS.filter((p) =>
        ["ceo-bezos", "critic-munger", "research-thompson"].includes(p.id),
      ),
      rationale: "Defaulting to core strategy trio",
    };
  }

  return { squad, rationale };
}

export interface PersonaOpinion {
  personaId: string;
  name: string;
  archetype: string;
  stance: "support" | "oppose" | "modify" | "abstain";
  primaryInsight: string;
  keyRisk: string;
  recommendation: string;
}

async function getPersonaOpinion(
  persona: Persona,
  question: string,
  context: string,
  userSettings?: UserSettings | null,
): Promise<PersonaOpinion> {
  const config = await routeByTaskType("deep_planning", userSettings);
  const system = `You are ${persona.name}, ${persona.archetype}.

Your framework: ${persona.framework}

Your key questions: ${persona.keyQuestions.join(" | ")}

Stay completely in character. Return JSON: { "personaId": "${persona.id}", "name": "${persona.name}", "archetype": "${persona.archetype}", "stance": "support"|"oppose"|"modify"|"abstain", "primaryInsight": "2-3 sentences using your framework", "keyRisk": "the single biggest risk you see", "recommendation": "one concrete action step" }. Return ONLY valid JSON.`;
  const user = `Question: ${question}\n\nContext: ${context}`;

  const raw = await callLLM(system, user, 1024, config);
  return parseJSON<PersonaOpinion>(raw);
}

export interface PreMortemResult {
  assumption: string;
  failureScenarios: string[];
  mitigations: string[];
  verdict: "proceed" | "pause" | "abort";
  reasoning: string;
}

export async function runPreMortem(
  plan: string,
  context: string,
  userSettings?: UserSettings | null,
): Promise<PreMortemResult> {
  const config = await routeByTaskType("deep_planning", userSettings);
  const munger = COUNCIL_PERSONAS.find((p) => p.id === "critic-munger")!;

  const system = `You are ${munger.name}. ${munger.framework}

Run a Pre-Mortem analysis. Assume the plan has already failed one year from now. Return JSON: { "assumption": "what you're evaluating", "failureScenarios": ["3 specific ways this fails"], "mitigations": ["mitigation for each scenario"], "verdict": "proceed"|"pause"|"abort", "reasoning": "blunt 2-3 sentence judgment" }. Return ONLY valid JSON.`;
  const user = `Plan to evaluate: ${plan}\n\nContext: ${context}`;

  const raw = await callLLM(system, user, config.maxTokens, config);
  return parseJSON<PreMortemResult>(raw);
}

export interface CouncilConsensus {
  question: string;
  workflow?: WorkflowType;
  squadRationale: string;
  squad: Array<{ id: string; name: string }>;
  opinions: PersonaOpinion[];
  consensus: string;
  dissent: string;
  finalRecommendation: string;
  confidenceScore: number;
  actionItems: string[];
  risks: string[];
  preMortem?: PreMortemResult;
  generatedAt: string;
}

async function synthesizeConsensus(
  question: string,
  opinions: PersonaOpinion[],
  userSettings?: UserSettings | null,
): Promise<{ consensus: string; dissent: string; finalRecommendation: string; confidenceScore: number; actionItems: string[]; risks: string[] }> {
  const config = await routeByTaskType("deep_planning", userSettings);

  const supportCount = opinions.filter((o) => o.stance === "support").length;
  const opposeCount = opinions.filter((o) => o.stance === "oppose").length;

  const opinionText = opinions
    .map((o) => `**${o.name}** (${o.stance}): ${o.primaryInsight} → ${o.recommendation}`)
    .join("\n\n");

  const system = `You are a master facilitator synthesizing expert council deliberation. ${supportCount} of ${opinions.length} panelists support, ${opposeCount} oppose. Return JSON: { "consensus": "what the majority agrees on", "dissent": "key objections", "finalRecommendation": "clear action path in 2-3 sentences", "confidenceScore": 0-100, "actionItems": ["3-5 concrete next steps"], "risks": ["2-3 key risks"] }. Return ONLY valid JSON.`;
  const user = `Question: ${question}\n\nDeliberation:\n${opinionText}`;

  const raw = await callLLM(system, user, config.maxTokens, config);
  return parseJSON(raw);
}

export async function runExpertCouncil(
  question: string,
  context: string,
  options?: {
    personaIds?: string[];
    workflow?: WorkflowType;
    runPreMortem?: boolean;
    userSettings?: UserSettings | null;
  },
): Promise<CouncilConsensus> {
  const { personaIds, workflow, runPreMortem: doPreMortem, userSettings } = options ?? {};

  let squadResult: SquadSelectionResult;
  if (personaIds && personaIds.length > 0) {
    squadResult = {
      squad: COUNCIL_PERSONAS.filter((p) => personaIds.includes(p.id)),
      rationale: "Manually specified",
    };
  } else {
    squadResult = await selectSquad(question, context, workflow, userSettings);
  }

  const [opinions, preMortemResult] = await Promise.all([
    Promise.all(
      squadResult.squad.map((p) =>
        getPersonaOpinion(p, question, context, userSettings),
      ),
    ),
    doPreMortem ? runPreMortem(question, context, userSettings) : Promise.resolve(undefined),
  ]);

  const synthesis = await synthesizeConsensus(question, opinions, userSettings);

  return {
    question,
    workflow,
    squadRationale: squadResult.rationale,
    squad: squadResult.squad.map((p) => ({ id: p.id, name: p.name })),
    opinions,
    ...synthesis,
    preMortem: preMortemResult,
    generatedAt: new Date().toISOString(),
  };
}
