/**
 * Marketing Framework Agent — TALE, ECHO, SEND, RAMP campaign generation.
 * TALE — Topic, Audience, Lens, Engagement
 * ECHO — Emotion, Connection, Hook, Offer
 * SEND — Story, Emotion, Narrate, Direct
 * RAMP — Reach, Amplify, Monetize, Persist
 */

import { callLLM, parseJSON } from "@/lib/llm";
import { routeByTaskType } from "@/lib/modelRouter";
import type { UserSettings } from "@/lib/modelRouter";

export type MarketingFramework = "TALE" | "ECHO" | "SEND" | "RAMP" | "ALL";

export interface CampaignInput {
  orgName: string;
  mission: string;
  audience: string;
  goal: string;
  channel: "email" | "social" | "linkedin" | "multi-channel";
  tone?: string;
  focusAreas?: string;
}

export interface TALEOutput {
  topic: string;
  audience: string;
  lens: string;
  engagement: string;
  contentIdeas: string[];
  headline: string;
  hook: string;
}

export interface ECHOOutput {
  emotion: string;
  connection: string;
  hook: string;
  offer: string;
  emailSubject: string;
  openingLine: string;
  cta: string;
}

export interface SENDOutput {
  story: string;
  emotion: string;
  narrate: string;
  direct: string;
  fullCopy: string;
  platform: string;
}

export interface RAMPOutput {
  reach: string;
  amplify: string;
  monetize: string;
  persist: string;
  channelStrategy: Record<string, string>;
  kpis: string[];
  timeline: string;
}

export interface MarketingCampaign {
  input: CampaignInput;
  tale?: TALEOutput;
  echo?: ECHOOutput;
  send?: SENDOutput;
  ramp?: RAMPOutput;
  generatedAt: string;
}

async function runTALE(input: CampaignInput, userSettings?: UserSettings | null): Promise<TALEOutput> {
  const config = await routeByTaskType("social_content", userSettings);
  const system = `You are a strategic content marketer applying the TALE framework (Topic, Audience, Lens, Engagement). Return JSON with: topic, audience, lens, engagement, contentIdeas (array of 5), headline, hook. Return ONLY valid JSON.`;
  const user = `Apply TALE for:
Organization: ${input.orgName}
Mission: ${input.mission}
Target Audience: ${input.audience}
Goal: ${input.goal}
Channel: ${input.channel}
Tone: ${input.tone || "warm, mission-driven, action-oriented"}`;

  const raw = await callLLM(system, user, config.maxTokens, config);
  return parseJSON<TALEOutput>(raw);
}

async function runECHO(input: CampaignInput, userSettings?: UserSettings | null): Promise<ECHOOutput> {
  const config = await routeByTaskType("email_draft", userSettings);
  const system = `You are an email copywriter applying the ECHO framework (Emotion, Connection, Hook, Offer). Return JSON with: emotion, connection, hook, offer, emailSubject (under 50 chars), openingLine, cta. Return ONLY valid JSON.`;
  const user = `Apply ECHO for:
Organization: ${input.orgName}
Mission: ${input.mission}
Target Audience: ${input.audience}
Goal: ${input.goal}
Tone: ${input.tone || "warm and mission-driven"}`;

  const raw = await callLLM(system, user, config.maxTokens, config);
  return parseJSON<ECHOOutput>(raw);
}

async function runSEND(input: CampaignInput, userSettings?: UserSettings | null): Promise<SENDOutput> {
  const config = await routeByTaskType("social_content", userSettings);
  const platform = input.channel === "social" ? "social media" : input.channel;
  const system = `You are a storytelling copywriter applying the SEND framework (Story, Emotion, Narrate, Direct). Return JSON with: story, emotion, narrate, direct, fullCopy (complete ready-to-publish ${platform} post, 150-280 words), platform ("${input.channel}"). Return ONLY valid JSON.`;
  const user = `Apply SEND for:
Organization: ${input.orgName}
Mission: ${input.mission}
Audience: ${input.audience}
Goal: ${input.goal}
Channel: ${input.channel}`;

  const raw = await callLLM(system, user, config.maxTokens, config);
  return parseJSON<SENDOutput>(raw);
}

async function runRAMP(input: CampaignInput, userSettings?: UserSettings | null): Promise<RAMPOutput> {
  const config = await routeByTaskType("social_content", userSettings);
  const system = `You are a growth strategist applying the RAMP framework (Reach, Amplify, Monetize, Persist). Return JSON with: reach, amplify, monetize, persist, channelStrategy (object mapping channel to tactics), kpis (array of 5), timeline. Return ONLY valid JSON.`;
  const user = `Apply RAMP for:
Organization: ${input.orgName}
Mission: ${input.mission}
Audience: ${input.audience}
Goal: ${input.goal}
Focus Areas: ${input.focusAreas || input.mission}`;

  const raw = await callLLM(system, user, config.maxTokens, config);
  return parseJSON<RAMPOutput>(raw);
}

export async function runMarketingCampaign(
  input: CampaignInput,
  frameworks: MarketingFramework[] = ["ALL"],
  userSettings?: UserSettings | null,
): Promise<MarketingCampaign> {
  const runAll = frameworks.includes("ALL");

  const [tale, echo, send, ramp] = await Promise.all([
    runAll || frameworks.includes("TALE") ? runTALE(input, userSettings) : Promise.resolve(undefined),
    runAll || frameworks.includes("ECHO") ? runECHO(input, userSettings) : Promise.resolve(undefined),
    runAll || frameworks.includes("SEND") ? runSEND(input, userSettings) : Promise.resolve(undefined),
    runAll || frameworks.includes("RAMP") ? runRAMP(input, userSettings) : Promise.resolve(undefined),
  ]);

  return { input, tale, echo, send, ramp, generatedAt: new Date().toISOString() };
}
