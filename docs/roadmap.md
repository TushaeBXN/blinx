# Blinx Product Roadmap

## Now — Core Agent Platform

- `/dashboard` — MVP: today's task queue, live SSE agent activity feed, pending approvals count, and quick-action shortcuts
- `/team` — Six AI agents (Claude API + SSE) with streaming chat and per-agent domain memory
- `/team/approvals` — Full payload preview, approve/reject with note, downstream action firing
- `/agents` — Enable/disable toggles, schedule picker (business / off-hours / manual / custom cron), employment type, full action audit log

## Next — Operational Modules

- `/crm` — Donor CRM with contact types (Donor, Volunteer, Partner, Vendor, Board), interaction log, auto-calculated `totalDonated` + `lastContact`
- `/inbox` — IMAP inbox with AI classification (grant/donor/support/vendor/compliance), priority routing, drafted replies, dark category sidebar
- `/compliance` — Compliance calendar auto-seeded by entity type with 990, 1023, BOI, 1099-NEC, W-2 deadlines grouped by month with urgency color bands
- `/grants` — Grant opportunity discovery with fit scoring, mission alignment, budget breakdowns, and KPI suggestions
- `/contractors` — 1099 contractor tracker with YTD payments, real-time progress bar toward $600 IRS threshold, and status badges

## Later — Full Operating System

- `/grant-writer` — End-to-end grant writer with structured narratives (Executive Summary, Statement of Need, Project Description, Goals, Evaluation, Capacity), inline AI redraft, and Drafting → In Review → Submitted → Awarded/Rejected pipeline
- `/social` — Multi-platform social scheduler with AI drafts per topic and tone, per-platform character enforcement, and approval queue integration
- `/time-tracker` — Staff and volunteer time logger with project breakdown, paid vs volunteer flag, hourly rate, and approval workflow
- `/domains` — Domain, SSL cert, and hosting renewal tracker with red/orange/yellow/green urgency tiers and Action Required banners
- `/reserve-fund` — Gumroad Ping reserve fund with auto-allocated sales percentage, deposit/withdrawal, target progress bar, and transaction history
- `/upwork` — Upwork freelance scout with AI fit scoring and generated proposal drafts ready for approval
