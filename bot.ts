/**
 * Blinx Telegram Bot
 * ─────────────────────────────────────────────
 * Self-hosted AI business team accessible via Telegram.
 * Powered by the configured LLM provider (Anthropic, OpenAI, Gemini, Mistral, Groq, Ollama, Abacus).
 *
 * Setup:
 *   1. Create a bot via @BotFather on Telegram → get token
 *   2. Add TELEGRAM_BOT_TOKEN=... to .env.local
 *   3. Run: npm run bot
 *
 * env loading is handled by dotenv-cli in package.json — no dotenv.config() needed here
 */

import { Telegraf, Context } from "telegraf";
import { message } from "telegraf/filters";
import { prisma } from "./src/lib/prisma";
import { callLLMChat } from "./src/lib/llm";
import { SOULS, routeToSoul, buildOrgContext, type OrgContext, type AgentSoul } from "./src/lib/bot/souls";

// ── In-memory conversation history (per chat) ─────────────────────
const chatHistory = new Map<number, { role: "user" | "assistant"; content: string }[]>();
const MAX_HISTORY = 20;

// ── Org context cache ─────────────────────────────────────────────
let orgContext: OrgContext | null = null;

async function getOrgContext(): Promise<OrgContext> {
  if (orgContext) return orgContext;
  try {
    const profile = await prisma.orgProfile.findFirst();
    orgContext = buildOrgContext(profile);
  } catch {
    orgContext = buildOrgContext(null);
  }
  return orgContext;
}

// ── LLM call (uses the configured provider from env) ──────────────
async function callAgent(
  soul: AgentSoul,
  history: { role: "user" | "assistant"; content: string }[],
  org: OrgContext
): Promise<string> {
  const systemPrompt = soul.systemPrompt(org);
  try {
    return await callLLMChat(systemPrompt, history);
  } catch (err) {
    const e = err as Error;
    if (e.message?.includes("ECONNREFUSED") || e.message?.includes("fetch")) {
      const host = process.env.OLLAMA_HOST || "http://localhost:11434";
      return `⚠️ Can't reach the LLM provider. If using Ollama at ${host}, make sure it's running:\n\`\`\`\nollama serve\n\`\`\``;
    }
    throw err;
  }
}

// ── Keep typing indicator alive ───────────────────────────────────
async function withTyping(ctx: Context & { chat: { id: number } }, fn: () => Promise<string>): Promise<string> {
  let done = false;
  const keepTyping = async () => {
    while (!done) {
      try { await ctx.sendChatAction("typing"); } catch { /* ignore */ }
      await new Promise((r) => setTimeout(r, 4000));
    }
  };
  keepTyping();
  try {
    return await fn();
  } finally {
    done = true;
  }
}

// ── Telegram safe send (splits long messages) ─────────────────────
async function safeSend(ctx: Context, text: string) {
  const MAX = 4096;
  if (text.length <= MAX) {
    await ctx.reply(text, { parse_mode: "Markdown" }).catch(() => ctx.reply(text));
    return;
  }
  const chunks: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    if (current.length + line.length + 1 > MAX) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current) chunks.push(current);
  for (const chunk of chunks) {
    await ctx.reply(chunk, { parse_mode: "Markdown" }).catch(() => ctx.reply(chunk));
  }
}

// ── Bot setup ─────────────────────────────────────────────────────
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN is not set in .env.local");
  console.error("   Create a bot via @BotFather on Telegram, then add:");
  console.error("   TELEGRAM_BOT_TOKEN=your_token_here");
  process.exit(1);
}

const bot = new Telegraf(token);

const activeProvider = process.env.LLM_PROVIDER || "anthropic";
const activeModel = process.env.OLLAMA_MODEL || process.env.ANTHROPIC_MODEL || "auto";

// /start
bot.start(async (ctx) => {
  const org = await getOrgContext();
  await ctx.reply(
    `*Welcome to Blinx* 🚀\n\nYour AI business team is online.\n\n` +
    `*Your agents:*\n` +
    Object.values(SOULS).map((s) => `${s.emoji} *${s.name}* — ${s.role}`).join("\n") +
    `\n\n*How to use:*\n` +
    `• Just talk naturally — I'll route to the right agent\n` +
    `• Address agents by name: _"Vesper, find me grants"_\n` +
    `• Use /commands for quick actions\n\n` +
    `Provider: \`${activeProvider}\` (model: \`${activeModel}\`)\n` +
    `Org: ${org.orgName}`,
    { parse_mode: "Markdown" }
  );
});

// /help
bot.help(async (ctx) => {
  await ctx.reply(
    `*Blinx Commands*\n\n` +
    `/agents — Show your AI team roster\n` +
    `/grants — Run a grant scan (Vesper)\n` +
    `/brief — Morning intelligence brief (Mira)\n` +
    `/tasks — View open tasks\n` +
    `/status — Check system & provider status\n` +
    `/clear — Clear conversation history\n` +
    `/dashboard — Web dashboard info\n\n` +
    `*Or just talk:*\n` +
    `_"Soleil, write a LinkedIn post about our new program"_\n` +
    `_"Dex, what's our burn rate looking like?"_\n` +
    `_"Nadia, what should I focus on today?"_`,
    { parse_mode: "Markdown" }
  );
});

// /agents
bot.command("agents", async (ctx) => {
  const lines = Object.values(SOULS).map(
    (s) => `${s.emoji} *${s.name}* (${s.role})\n   _Trigger: ${s.aliases.slice(0, 3).join(", ")}_`
  );
  await ctx.reply(`*Your AI Team*\n\n${lines.join("\n\n")}`, { parse_mode: "Markdown" });
});

// /grants
bot.command("grants", async (ctx) => {
  const org = await getOrgContext();

  const response = await withTyping(ctx as Context & { chat: { id: number } }, async () => {
    const prompt = `Run a full grant scan for ${org.orgName}. Mission: ${org.mission}. Focus: ${org.focusAreas}. Location: ${org.location}. Find 6-8 active opportunities across Federal, private foundations, and CSR. Output as a clean markdown list with Name, Funder, Amount, Deadline, Alignment Score, and Action Required.`;
    const history = [{ role: "user" as const, content: prompt }];
    return await callAgent(SOULS["vesper"]!, history, org);
  });

  try {
    const user = await prisma.user.findFirst();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).document.create({
        data: {
          userId: user.id,
          type: "grant_pipeline",
          title: `Grant Scan — ${new Date().toLocaleDateString()}`,
          content: response,
        },
      });
    }
  } catch { /* non-critical */ }

  // biome-ignore lint: SOULS.vesper is a known key
  await safeSend(ctx, `${SOULS["vesper"]!.emoji} *Vesper — Grant Scan*\n\n${response}`);
});

// /brief
bot.command("brief", async (ctx) => {
  const org = await getOrgContext();

  const response = await withTyping(ctx as Context & { chat: { id: number } }, async () => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const prompt = `Generate the morning intelligence brief for ${today}. Cover: global news relevant to ${org.focusAreas}, tech/AI developments, market trends, opportunities and threats, and any flags for the owner.`;
    const history = [{ role: "user" as const, content: prompt }];
    return await callAgent(SOULS["mira"]!, history, org);
  });

  try {
    const user = await prisma.user.findFirst();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).document.create({
        data: {
          userId: user.id,
          type: "morning_brief",
          title: `Morning Brief — ${new Date().toLocaleDateString()}`,
          content: response,
        },
      });
    }
  } catch { /* non-critical */ }

  // biome-ignore lint: SOULS.mira is a known key
  await safeSend(ctx, `${SOULS["mira"]!.emoji} *Mira — Morning Brief*\n\n${response}`);
});

// /tasks
bot.command("tasks", async (ctx) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasks = await (prisma as any).task.findMany({
      where: { status: { in: ["todo", "in_progress"] } },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    if (tasks.length === 0) {
      await ctx.reply("✅ No open tasks. Clean slate!");
      return;
    }

    const lines = (tasks as Array<{ title: string; status: string; category: string; scheduledFor: string }>).map((t) => {
      const statusEmoji = t.status === "in_progress" ? "🔄" : "⬜";
      return `${statusEmoji} *${t.title}*\n   ${t.category} — ${t.scheduledFor}`;
    });

    await ctx.reply(`*Open Tasks (${tasks.length})*\n\n${lines.join("\n\n")}`, { parse_mode: "Markdown" });
  } catch {
    await ctx.reply("Couldn't load tasks. Make sure the web app has been set up.");
  }
});

// /status
bot.command("status", async (ctx) => {
  // Check database
  let dbStatus = "❌ Error";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "✅ Connected";
  } catch { /* error */ }

  // Check Ollama if configured
  let ollamaStatus = "";
  let ollamaModels: string[] = [];
  if (activeProvider === "ollama" || process.env.OLLAMA_HOST) {
    try {
      const { Ollama } = await import("ollama");
      const ollama = new Ollama({ host: process.env.OLLAMA_HOST || "http://localhost:11434" });
      const list = await ollama.list();
      ollamaModels = list.models.map((m: { name: string }) => m.name);
      ollamaStatus = `\nOllama: ✅ Online (${ollamaModels.length} model${ollamaModels.length !== 1 ? "s" : ""})`;
    } catch {
      ollamaStatus = `\nOllama: ❌ Not reachable`;
    }
  }

  const providers = [
    ["Anthropic", "ANTHROPIC_API_KEY"],
    ["OpenAI", "OPENAI_API_KEY"],
    ["Gemini", "GEMINI_API_KEY"],
    ["Mistral", "MISTRAL_API_KEY"],
    ["Groq", "GROQ_API_KEY"],
    ["Abacus", "ABACUS_API_KEY"],
  ] as const;

  const providerLines = providers
    .filter(([, key]) => process.env[key])
    .map(([name]) => `✅ ${name}`)
    .join("\n");

  const modelList = ollamaModels.length > 0
    ? `\n\n*Local Ollama models:*\n${ollamaModels.map((m) => `• \`${m}\``).join("\n")}`
    : "";

  await ctx.reply(
    `*System Status*\n\n` +
    `Database: ${dbStatus}` +
    ollamaStatus + "\n\n" +
    `*Configured providers:*\n` +
    (providerLines || "None — add API keys to .env.local") +
    `\n\nActive: \`${activeProvider}\`` +
    modelList,
    { parse_mode: "Markdown" }
  );
});

// /clear
bot.command("clear", async (ctx) => {
  chatHistory.delete(ctx.chat.id);
  await ctx.reply("🧹 Conversation history cleared.");
});

// /dashboard
bot.command("dashboard", async (ctx) => {
  await ctx.reply(
    `*Blinx Dashboard*\n\n` +
    `Open your web browser and go to:\n` +
    `\`http://localhost:3000\`\n\n` +
    `Start both the web app and bot with:\n` +
    `\`npm run start:all\``,
    { parse_mode: "Markdown" }
  );
});

// Main message handler
bot.on(message("text"), async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text;

  if (text.startsWith("/")) return;

  const org = await getOrgContext();
  const soul = routeToSoul(text);

  const history = chatHistory.get(chatId) ?? [];
  history.push({ role: "user", content: text });

  const response = await withTyping(ctx as Context & { chat: { id: number } }, async () => {
    return await callAgent(soul, history, org);
  });

  history.push({ role: "assistant", content: response });
  while (history.length > MAX_HISTORY) history.splice(0, 2);
  chatHistory.set(chatId, history);

  const header = `${soul.emoji} *${soul.name}* (${soul.role})`;
  await safeSend(ctx, `${header}\n\n${response}`);
});

// Error handler
bot.catch((err, ctx) => {
  console.error(`[Bot] Error for ${ctx.updateType}:`, err);
  ctx.reply("Something went wrong. Check the console for details.").catch(() => {});
});

// Launch
console.log("🚀 Blinx bot starting...");
console.log(`   Provider: ${activeProvider} (model: ${activeModel})`);

bot.launch({
  allowedUpdates: ["message", "callback_query"],
}).then(() => {
  console.log("✅ Blinx bot is running. Open Telegram and start chatting.");
}).catch((err) => {
  console.error("❌ Bot failed to start:", (err as Error).message);
  process.exit(1);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
