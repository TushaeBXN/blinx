# Blinx — The crew you don't have headcount for.

Blinx is a full-stack AI operating system for small and mid-sized nonprofits. It replaces the half-dozen subscriptions most orgs stitch together for operations — grants, compliance, donor relations, inbox triage, budgeting, and marketing — with a single platform backed by an AI workforce that runs on the provider you already pay for or a local model you own outright.

---

## The AI Team

Eight named agents handle the day-to-day. Every agent has a voice, a job, and a memory of what's happened before.

| Agent | Role | What they do |
|-------|------|--------------|
| 👩‍💼 **Nadia** | CEO / Strategist | Prioritizes the day, delegates to the right agent, flags blockers, keeps you focused on mission |
| 🔍 **Vesper** | Grant Architect | Scans Federal, foundation, and CSR pipelines; scores alignment; drafts narratives |
| 💻 **Kael** | Lead Developer | Writes scripts, automates workflows, and handles technical deliverables |
| ✨ **Soleil** | Marketing & Brand | LinkedIn posts, campaign copy, social content using TALE/ECHO/SEND/RAMP frameworks |
| 🌅 **Mira** | Intelligence Briefing | Morning brief with sector news, AI/tech developments, market signals, and flags |
| 📊 **Dex** | CFO / Finance | Budget analysis, reserve fund strategy, burn rate, financial scenario modeling |
| 🏗️ **Zion** | Systems Architect | Infrastructure decisions, tooling, workflow design |
| 💰 **Kash** | Investor & Opportunities | Opportunity scouting, partnership analysis, revenue modeling |

Agents run on a nightly loop and a morning cool-down. Every run is logged to the activity feed.

---

## Modules

### Grant Management
- Live grant pipeline with scoring, deadline tracking, and alignment by mission/focus area
- AI-assisted grant writing (Vesper) with full narrative drafts
- Grant application status tracking from prospect to submitted

### Compliance
- Nonprofit compliance calendar with automatic deadline seeding (990, state filings, bylaws reviews, board meetings)
- Custom reminder scheduling and compliance health scoring
- Tax deadline reference by state

### Budget & Finance
- Multi-category budget with actual vs. planned tracking
- Reserve fund with transaction ledger and growth targets
- QuickBooks integration (OAuth sync, chart of accounts, reconciliation)
- Board-ready budget export to PDF and PPTX

### Impact Tracker
- Program session logging (participants, hours, outcomes)
- Metric tracking over time with period comparison
- Session feedback collection
- Automated impact report generation with AI narrative

### CRM / Donor Relations
- Full contact database with interaction history, categories, and engagement scores
- AI-assisted outreach scheduling and donor communication
- Pipeline tracking from prospect to major donor

### Inbox
- IMAP email sync with multi-account support (Gmail, Outlook, custom SMTP)
- AI triage and smart draft replies
- Approval queue for outbound messages — nothing sends without human sign-off
- Email ingestion and processing via background sync

### Documents
- Document library with upload, AI research generation, and export
- PDF, PPTX, and CSV export across the platform
- Document versioning and type categorization

### Social Media
- Scheduled post drafts with AI copy generation (Soleil)
- Multi-channel queue management
- Campaign and content calendar

### Contractors
- Contractor roster with rate tracking and project assignments
- Payment logging and 1099-ready history
- Deliverable and time tracking per contractor

### Time Tracker
- Per-agent and per-project time logging
- Billable hours export

### Board Report
- AI-generated board-ready reports pulling live data from every module
- Executive summary, financial summary, program highlights, compliance status, and strategic priorities
- One-click export to PDF and PPTX

### Channels
- Internal messaging channels with AI-assisted responses
- Human-in-the-loop approval flow for AI-generated outbound messages

### Agent Council
- Multi-agent strategic consensus: 11 expert personas weigh in on a question
- Personas include: Bezos (operators), Munger (mental models), Seth Godin (marketing), Aaron Ross (sales systems), Paul Graham (product), Don Norman (design), Kelsey Hightower (infrastructure), and more
- Used for high-stakes decisions, strategy reviews, and grant approach planning

---

## Telegram Bot

Run your entire AI workforce from Telegram. The bot supports every agent and every major command:

```
/start    — Welcome and agent roster
/help     — Command reference
/agents   — Show the full team with triggers
/grants   — Run a live grant scan (Vesper)
/brief    — Morning intelligence brief (Mira)
/tasks    — View open tasks
/status   — Check provider and database health
/clear    — Clear conversation history
/dashboard — Open the web dashboard
```

Or just talk: _"Soleil, write a LinkedIn post about our new program"_ — the bot routes naturally to the right agent.

Start the bot:
```bash
npm run bot          # bot only
npm run start:all    # web app + bot together
```

Requires `TELEGRAM_BOT_TOKEN` in `.env.local` (get one from `@BotFather`).

---

## AI Provider Support

Blinx is provider-agnostic. Set `LLM_PROVIDER` in `.env.local` and add the corresponding key.

| Provider | Env var | Notes |
|----------|---------|-------|
| Anthropic | `ANTHROPIC_API_KEY` | Default; Claude Sonnet/Haiku routing by task type |
| OpenAI | `OPENAI_API_KEY` | GPT-4o for code tasks, GPT-4o-mini for light tasks |
| Google Gemini | `GEMINI_API_KEY` | Gemini 1.5 Pro/Flash |
| Mistral | `MISTRAL_API_KEY` | mistral-large-latest / mistral-small-latest |
| Groq | `GROQ_API_KEY` | llama-3.1-70b, llama-3.3-70b-specdec for research |
| Abacus | `ABACUS_API_KEY` | Single key, routes to any model by name |
| Ollama | `OLLAMA_HOST` | Local, self-hosted — no API costs, runs on your own hardware or VPS |

### Smart routing by task type

The model router picks the right model for each task automatically — Claude Sonnet for deep planning and grant writing, GPT-4o for code, Haiku for quick email drafts and status notes — regardless of which provider you've configured. When using a non-preferred provider, it falls back to the best tier within that provider's model family.

### Running open source models (no API costs)

Set `LLM_PROVIDER=ollama` and point `OLLAMA_HOST` at any machine running [Ollama](https://ollama.com). What you can run depends on your hardware:

**Cloud / VPS** — A GPU-equipped VPS (e.g. Lambda Labs, RunPod, Vast.ai) gives you on-demand access to large models without owning hardware. Rent by the hour when you need it.

**Mini PC** — A machine with 32–64 GB unified or system RAM (Mac Mini M4 Pro, Intel NUC, mini PC with DDR5) can run 7B–70B parameter models comfortably. Good for always-on local inference.

**Desktop GPU** — An NVIDIA card with 16–80 GB VRAM (RTX 4090, A6000, H100) handles 70B+ models at full precision. Best throughput for heavy workloads.

**Recommended models by available RAM:**

| RAM | Suggested models |
|-----|-----------------|
| 8 GB | llama3.2:3b, phi3:mini |
| 32 GB | llama3.1:8b, mistral:7b, gemma2:9b |
| 64 GB | llama3.1:70b, qwen2.5:72b, mixtral:8x7b |
| 128 GB+ | llama3.1:405b (quantized), qwen2.5:72b, llama3.3:70b |

Any model that runs on Ollama works — just set `OLLAMA_MODEL` to the tag you pulled.

---

## Automated Scheduling

The platform runs two scheduled loops:

- **Nightly loop** — CEO prioritizes the day, all agents run in parallel, grant scan runs independently, morning report compiles and emails (if `RESEND_API_KEY` is set)
- **Cool-down** — End-of-day debrief summarizing what got done and what's open

Schedules are configurable per user in Settings. Every cron run logs to the activity feed.

---

## Integrations

| Service | Purpose |
|---------|---------|
| QuickBooks | OAuth sync, chart of accounts, financial reconciliation |
| Stripe | Subscription billing, customer portal |
| Resend | Transactional email, morning reports |
| Gumroad | Sale webhooks → revenue tracking |
| CallCatch | AI phone receptionist (webhook at `/api/webhooks/callcatch`) — coming soon |

---

## Approval-First Design

**Nothing goes out without you.** Every AI-drafted message, email, or post lands in an approval queue first. Agents write; you send. The `outboundWithoutReview` count in the codebase is `0` and stays there.

---

## Stack

- **Next.js 16** App Router, React 19, TypeScript strict
- **Tailwind 4** CSS-first theming, shadcn/ui New York primitives
- **Prisma 7** + PostgreSQL
- **NextAuth** session management
- **Biome** lint + format, **Vitest** tests
- **Telegraf** Telegram bot framework
- **node-cron** in-process scheduler for dev; `polsia.toml` `[[crons]]` for production

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/TushaeBXN/blinx.git
cd blinx

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env.local
# Add DATABASE_URL, NEXTAUTH_SECRET, LLM_PROVIDER + your API key(s)

# 4. Push database schema
npx prisma db push

# 5. Start
npm run dev           # web app only
npm run bot           # Telegram bot only
npm run start:all     # both
```

### Required env vars

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
LLM_PROVIDER=anthropic          # anthropic | openai | gemini | mistral | groq | ollama | abacus
ANTHROPIC_API_KEY=...           # or whichever provider key you're using
```

### Optional env vars

```env
# Telegram bot
TELEGRAM_BOT_TOKEN=...

# Email
RESEND_API_KEY=...

# Integrations
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
QUICKBOOKS_CLIENT_ID=...
QUICKBOOKS_CLIENT_SECRET=...
GUMROAD_SECRET=...

# Ollama (local models)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Other providers
OPENAI_API_KEY=...
GEMINI_API_KEY=...
MISTRAL_API_KEY=...
GROQ_API_KEY=...
ABACUS_API_KEY=...
```

---

## Project Structure

```
src/
├── app/
│   ├── api/              API route handlers (one per resource)
│   ├── agents/           Agent workforce dashboard
│   ├── board-report/     AI board report generator
│   ├── budget/           Budget and finance module
│   ├── chat/             Direct AI chat
│   ├── compliance/       Compliance calendar and tracking
│   ├── contractors/      Contractor management
│   ├── crm/              Donor and contact CRM
│   ├── dashboard/        Main dashboard + activity feed
│   ├── documents/        Document library and AI research
│   ├── domains/          Domain management
│   ├── grant-writer/     AI grant narrative writing
│   ├── grants/           Grant pipeline and tracking
│   ├── impact/           Impact tracking and reports
│   ├── inbox/            Email inbox with AI triage
│   ├── reserve-fund/     Reserve fund ledger
│   ├── settings/         User and org settings
│   ├── social/           Social media scheduler
│   ├── tasks/            Task management
│   ├── team/             Team management
│   ├── time-tracker/     Time logging
├── lib/
│   ├── agents/           Agent logic (CEO, marketing, grants, sales, etc.)
│   ├── bot/              Telegram bot soul definitions
│   ├── llm.ts            Multi-provider LLM client
│   ├── modelRouter.ts    Task-type → model routing
│   ├── scheduler.ts      Nightly loop + cool-down
│   ├── engram.ts         Agent memory system
│   └── consensusMemory.ts  Council consensus tracking
└── bot.ts                Telegram bot entry point
```

---

## License

MIT
