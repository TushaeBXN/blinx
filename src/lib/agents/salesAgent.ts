/**
 * AI Sales Team — 5 parallel subagents for full prospect intelligence.
 * Subagents: companyResearch, decisionMakers, opportunityScore, competitiveIntel, outreachStrategy
 */

import { callLLMWithSearch, callLLM, parseJSON } from "@/lib/llm";
import { routeByTaskType } from "@/lib/modelRouter";
import type { UserSettings } from "@/lib/modelRouter";

export interface ProspectInput {
  companyName: string;
  website?: string;
  industry?: string;
  targetRole?: string;
  ourProduct?: string;
  ourValueProp?: string;
}

export interface CompanyProfile {
  name: string;
  description: string;
  size: string;
  industry: string;
  revenue: string;
  techStack: string[];
  recentNews: string[];
  painPoints: string[];
  growthSignals: string[];
}

export interface DecisionMaker {
  name: string;
  title: string;
  linkedinSignals: string;
  likelyPriorities: string[];
  bestApproach: string;
}

export interface OpportunityScore {
  bantScore: number;
  budget: string;
  authority: string;
  need: string;
  timeline: string;
  meddicScore: number;
  metrics: string;
  economicBuyer: string;
  decisionCriteria: string;
  decisionProcess: string;
  identifiedPain: string;
  champion: string;
  overallScore: number;
  recommendation: "pursue" | "nurture" | "disqualify";
  reasoning: string;
}

export interface CompetitiveIntel {
  mainCompetitors: string[];
  ourAdvantages: string[];
  ourWeaknesses: string[];
  competitorPositioning: string;
  battlecardPoints: string[];
}

export interface OutreachSequence {
  subject: string;
  email1: string;
  linkedin1: string;
  email2: string;
  callScript: string;
  email3: string;
  keyHooks: string[];
}

export interface ProspectReport {
  prospect: ProspectInput;
  company: CompanyProfile;
  decisionMakers: DecisionMaker[];
  opportunity: OpportunityScore;
  competitive: CompetitiveIntel;
  outreach: OutreachSequence;
  generatedAt: string;
}

async function runCompanyResearch(
  prospect: ProspectInput,
  userSettings?: UserSettings | null,
): Promise<CompanyProfile> {
  const config = await routeByTaskType("research", userSettings);
  const system = `You are an expert B2B company researcher. Return JSON with fields: name, description, size, industry, revenue, techStack (array), recentNews (array of 3-5), painPoints (array), growthSignals (array). Return ONLY valid JSON.`;
  const user = `Research this company for sales prospecting:
Company: ${prospect.companyName}
Website: ${prospect.website || "unknown"}
Industry: ${prospect.industry || "unknown"}
We sell: ${prospect.ourProduct || "technology solutions"}`;

  const raw = await callLLMWithSearch(system, user, config.maxTokens, config);
  return parseJSON<CompanyProfile>(raw);
}

async function runDecisionMakerResearch(
  prospect: ProspectInput,
  company: CompanyProfile,
  userSettings?: UserSettings | null,
): Promise<DecisionMaker[]> {
  const config = await routeByTaskType("research", userSettings);
  const system = `You are an expert at identifying B2B decision makers. Return a JSON array of 2-4 key stakeholders with fields: name, title, linkedinSignals, likelyPriorities (array), bestApproach. Return ONLY valid JSON array.`;
  const user = `Identify decision makers for selling into ${prospect.companyName}.
Company size: ${company.size}
Industry: ${company.industry}
Target role: ${prospect.targetRole || "VP/Director level"}
Our solution: ${prospect.ourProduct || "technology solutions"}
Company pain points: ${company.painPoints.join(", ")}`;

  const raw = await callLLMWithSearch(system, user, config.maxTokens, config);
  return parseJSON<DecisionMaker[]>(raw);
}

async function runOpportunityScore(
  prospect: ProspectInput,
  company: CompanyProfile,
  decisionMakers: DecisionMaker[],
  userSettings?: UserSettings | null,
): Promise<OpportunityScore> {
  const config = await routeByTaskType("research", userSettings);
  const system = `You are a senior sales qualification expert trained in BANT and MEDDIC. Return JSON with: bantScore (0-100), budget, authority, need, timeline, meddicScore (0-100), metrics, economicBuyer, decisionCriteria, decisionProcess, identifiedPain, champion, overallScore (0-100), recommendation ("pursue"|"nurture"|"disqualify"), reasoning. Return ONLY valid JSON.`;
  const user = `Score this opportunity:
Company: ${prospect.companyName} (${company.size}, ${company.revenue})
Pain points: ${company.painPoints.join("; ")}
Growth signals: ${company.growthSignals.join("; ")}
Decision makers: ${decisionMakers.map((d) => d.title).join(", ")}
Our value prop: ${prospect.ourValueProp || "improved efficiency and ROI"}`;

  const raw = await callLLM(system, user, config.maxTokens, config);
  return parseJSON<OpportunityScore>(raw);
}

async function runCompetitiveIntel(
  prospect: ProspectInput,
  company: CompanyProfile,
  userSettings?: UserSettings | null,
): Promise<CompetitiveIntel> {
  const config = await routeByTaskType("research", userSettings);
  const system = `You are a competitive intelligence analyst. Return JSON with: mainCompetitors (array), ourAdvantages (array), ourWeaknesses (array), competitorPositioning (string), battlecardPoints (array). Return ONLY valid JSON.`;
  const user = `Competitive analysis for selling ${prospect.ourProduct || "our solution"} to ${prospect.companyName}.
Industry: ${company.industry}
Tech stack: ${company.techStack.join(", ")}`;

  const raw = await callLLMWithSearch(system, user, config.maxTokens, config);
  return parseJSON<CompetitiveIntel>(raw);
}

async function runOutreachStrategy(
  prospect: ProspectInput,
  company: CompanyProfile,
  decisionMakers: DecisionMaker[],
  opportunity: OpportunityScore,
  competitive: CompetitiveIntel,
  userSettings?: UserSettings | null,
): Promise<OutreachSequence> {
  const config = await routeByTaskType("email_draft", userSettings);
  const primaryContact = decisionMakers[0];
  const system = `You are an elite B2B sales copywriter. Return JSON with: subject, email1 (100-150 words), linkedin1 (50 words max), email2 (80-100 words), callScript (30-second opener), email3 (60 words), keyHooks (array of 3). Return ONLY valid JSON.`;
  const user = `Write a personalized 6-touch outreach sequence for:
Contact: ${primaryContact?.title || "Decision Maker"} at ${prospect.companyName}
Their pain: ${opportunity.identifiedPain}
Our angle: ${prospect.ourValueProp || "drive measurable ROI"}
Key differentiator: ${competitive.ourAdvantages[0] || "superior solution"}
Recent news: ${company.recentNews[0] || "growth signals"}`;

  const raw = await callLLM(system, user, config.maxTokens, config);
  return parseJSON<OutreachSequence>(raw);
}

export async function runSalesProspect(
  prospect: ProspectInput,
  userSettings?: UserSettings | null,
): Promise<ProspectReport> {
  const [company] = await Promise.all([
    runCompanyResearch(prospect, userSettings),
  ]);

  const [decisionMakers] = await Promise.all([
    runDecisionMakerResearch(prospect, company, userSettings),
  ]);

  const [opportunity, competitive] = await Promise.all([
    runOpportunityScore(prospect, company, decisionMakers, userSettings),
    runCompetitiveIntel(prospect, company, userSettings),
  ]);

  const outreach = await runOutreachStrategy(
    prospect,
    company,
    decisionMakers,
    opportunity,
    competitive,
    userSettings,
  );

  return {
    prospect,
    company,
    decisionMakers,
    opportunity,
    competitive,
    outreach,
    generatedAt: new Date().toISOString(),
  };
}
