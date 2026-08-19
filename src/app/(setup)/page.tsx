// @polsia:user-owned — landing page for Blinx. Server Component (required so the
// metadata export drives the title/description). Interactivity lives in a child
// 'use client' component imported below.

import type { Metadata } from 'next';
import Link from 'next/link';
import { ApprovalTabs } from '@/components/custom/approval-tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { siteDescription, siteName } from '@/lib/site';

// Keep this a Server Component so it can export metadata.
export const metadata: Metadata = {
  title: { absolute: siteName },
  description: siteDescription,
  // Do not export an explicit openGraph object here; that suppresses the
  // file-based opengraph-image.tsx for the home route.
  alternates: { canonical: '/' },
};

const AGENTS = [
  {
    key: 'ceo',
    name: 'CEO Strategist',
    beat: 'Board narrative & quarterly priorities',
    mark: 'ceo',
  },
  {
    key: 'marketing',
    name: 'Marketing Lead',
    beat: 'Story-of-impact posts per channel',
    mark: 'marketing',
  },
  {
    key: 'grants',
    name: 'Grant Architect',
    beat: 'Structured narratives + Drafting→Awarded pipeline',
    mark: 'grants',
  },
  {
    key: 'inbox',
    name: 'Inbox Triage Manager',
    beat: 'Classified IMAP with drafted replies',
    mark: 'inbox',
  },
  {
    key: 'upwork',
    name: 'Upwork Scout',
    beat: 'Vetted freelance shortlist per project',
    mark: 'upwork',
  },
  { key: 'bookkeeper', name: 'Bookkeeper', beat: 'Reconciliation + reserve allocation', mark: 'bookkeeper' },
] as const;

const MODULES = [
  { tag: '01', name: 'Grant Writer', text: 'Narratives, budgets, letters of inquiry, submission timeline.' },
  { tag: '02', name: 'Grant Opportunity Dashboard', text: 'Instrumentl-style feed, fit score, deadline radius.' },
  { tag: '03', name: 'Donor CRM', text: 'Bloomerang-style contacts with auto-rolled giving totals.' },
  {
    tag: '04',
    name: 'AI Inbox',
    text: 'HEALTH/GRANTS/DONOR/SPAM classification with reply drafts queued for review.',
  },
  {
    tag: '05',
    name: 'Compliance Calendar',
    text: '990, BOI, Form 1023, 1099-NEC, W-2 — auto-seeded by entity type.',
  },
  {
    tag: '06',
    name: '1099 Contractor Tracker',
    text: 'QuickBooks OAuth sync, $600 threshold meter, TIN collection, e-file.',
  },
  {
    tag: '07',
    name: 'Social Scheduler',
    text: 'Buffer-style multi-platform queue with per-platform character enforcement.',
  },
  {
    tag: '08',
    name: 'Time Logger',
    text: 'Staff and volunteer hours, project tags, grant-attribution ready.',
  },
  {
    tag: '09',
    name: 'Domain & SSL Monitor',
    text: 'Renewal warnings two months ahead — never lose an email domain again.',
  },
] as const;

const CURRENT_TOOLS = [
  { name: 'QuickBooks', reason: 'Books' },
  { name: 'Instrumentl', reason: 'Grant discovery' },
  { name: 'Bloomerang', reason: 'Donor CRM' },
  { name: 'Buffer', reason: 'Social queue' },
  { name: 'A spreadsheet', reason: 'Volunteer hours' },
  { name: 'A paper calendar', reason: '990 deadline' },
  { name: 'Gmail tabs', reason: 'Inbox triage' },
  { name: 'Upwork.com', reason: 'Freelance sourcing' },
] as const;

const APPROVALS = [
  {
    label: 'Outbound email',
    title: 'Re: Bellingham Community Fund — thank-you follow-up',
    preview: {
      to: 'maya.lin@bellinghamfund.org',
      subject: 'Thank you — and a quick update on Q2 metrics',
      preview:
        "Hi Maya — thank you for digging into our Q1 numbers with the committee on Tuesday. I wanted to share the updated outcome dashboard we discussed: 412 students matched this quarter (up 18% …)",
      signals: ['personalized opener', 'links to recent outcome data', 'schedule: Tuesday 9:30 AM PT'],
    },
  },
  {
    label: 'Social post',
    title: 'Buffer → LinkedIn · Story of impact',
    preview: {
      to: 'Bluesky Youth · LinkedIn',
      subject: '263 characters · 3 sentences',
      preview:
        "When Rosa joined our after-school program she hadn't read a full book in two years. Yesterday she finished her fourth. That's why Bluesky exists — and why your support matters. #nonprofit #edimpact",
      signals: ['under LinkedIn 700 limit', 'tagged #nonprofit x1', 'schedule: Thursday 10:00 AM'],
    },
  },
  {
    label: 'Grant submission',
    title: 'Burlington Family Foundation — Letter of Inquiry',
    preview: {
      to: 'loi@burlingtonff.org',
      subject: 'Project: Bridge tutoring — request $48,000',
      preview:
        "Letter of inquiry, 1,342 words across Problem / Approach / Org capacity / Budget snapshot. Drafting → Reviewed → Approved → Submitted. Server-side submission on 2026-09-04.",
      signals: ['budget aligned to last award', 'org capacity: 7-year track record', 'submitted via portal + receipt'],
    },
  },
  {
    label: 'Contractor payment',
    title: 'Upwork → Sara K., web accessibility audit',
    preview: {
      to: 'sara.k@upwork.com',
      subject: 'Release $1,240 · milestone: audit v2',
      preview:
        "Two-week engagement, 1099-NEC drafted. Live total this year: $3,840 (below $600? — no, above). W-9 on file since 2024-11-12.",
      signals: ['1099-NEC threshold: $840 / $600', 'W-9 present', 'QuickBooks sync ✓'],
    },
  },
] as const;

const DEADLINES = [
  { tag: '990', when: 'Aug 15', tone: 'high' },
  { tag: 'BOI', when: 'Sep 30', tone: 'urgent' },
  { tag: '1099-NEC', when: 'Jan 31', tone: 'pending' },
  { tag: 'W-2', when: 'Jan 31', tone: 'pending' },
  { tag: 'Form 1023', when: 'rolling', tone: 'pending' },
  { tag: 'State annual', when: 'varies', tone: 'pending' },
] as const;

function AgentIcon({ mark }: { mark: (typeof AGENTS)[number]['mark'] }) {
  // Inline SVG marks — each agent gets a distinct geometric sign.
  switch (mark) {
    case 'ceo':
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
          <rect x="3" y="9" width="18" height="11" rx="2" fill="currentColor" opacity=".15" />
          <path d="M7 14l3-3 3 3 4-5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7" cy="14" r="1.2" fill="currentColor" />
          <circle cx="17" cy="9" r="1.2" fill="currentColor" />
        </svg>
      );
    case 'marketing':
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
          <path d="M4 10v4M8 7v10M12 5v14M16 8v8M20 11v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" fill="none" opacity=".35" />
        </svg>
      );
    case 'grants':
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
          <rect x="4" y="3" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M8 8h6M8 12h6M8 16h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="19" cy="7" r="3" fill="currentColor" opacity=".25" />
        </svg>
      );
    case 'inbox':
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M3 10h5l2 3h4l2-3h5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
          <path d="M9 5l3-2 3 2" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'upwork':
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
          <circle cx="9" cy="12" r="6" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <circle cx="16" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M11 12h3" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case 'bookkeeper':
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
          <rect x="3" y="5" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 14h4M7 17h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="16" cy="15.5" r="2" fill="currentColor" opacity=".25" />
        </svg>
      );
  }
}

function HeroConstellation() {
  // Six nodes, one per agent, arranged around a central anchor. SVG-only — no
  // raster images, so it flips with the theme.
  const nodes: Array<{ cx: number; cy: number; r: number; label: string }> = [
    { cx: 130, cy: 60, r: 18, label: 'CEO' },
    { cx: 290, cy: 80, r: 16, label: 'Grant' },
    { cx: 410, cy: 50, r: 15, label: 'Mktg' },
    { cx: 250, cy: 190, r: 20, label: 'Inbox' },
    { cx: 410, cy: 200, r: 16, label: 'Upwork' },
    { cx: 130, cy: 220, r: 16, label: 'Books' },
  ];
  return (
    <svg viewBox="0 0 500 280" className="w-full max-w-[520px]" aria-hidden>
      <defs>
        <radialGradient id="bg-fade" cx="50%" cy="50%" r="60%">
          <stop offset="0%" className="text-brand-400" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" className="text-brand-400" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="halo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="text-brand-500" stopColor="currentColor" stopOpacity="0.55" />
          <stop offset="100%" className="text-brand-500" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="500" height="280" fill="url(#bg-fade)" />
      {/* The web of approvals — lines from each agent to the central anchor. */}
      {nodes.map((n, i) => (
        <line
          key={i}
          x1={n.cx}
          y1={n.cy}
          x2={270}
          y2={140}
          className="stroke-brand-500"
          stroke="currentColor"
          strokeWidth="0.6"
          strokeDasharray="2 3"
          opacity="0.7"
        />
      ))}
      {/* Soft vertical "stack plane" band on the right edge. */}
      <rect x="430" y="0" width="70" height="280" fill="url(#halo)" opacity="0.6" />
      {/* Central anchor — the approval queue. */}
      <circle cx="270" cy="140" r="36" className="fill-brand-500/20 stroke-brand-500" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="270" cy="140" r="6" className="fill-brand-500" fill="currentColor" />
      <text x="270" y="188" textAnchor="middle" className="fill-foreground" fontSize="9" fontFamily="ui-sans-serif,system-ui">
        approval queue
      </text>
      {/* Nodes. */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.cx} cy={n.cy} r={n.r + 4} className="fill-background stroke-border" fill="currentColor" fillOpacity="0" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <circle cx={n.cx} cy={n.cy} r={n.r} className="fill-card stroke-brand-500" fill="currentColor" fillOpacity="0" stroke="currentColor" strokeWidth="1.4" />
          <text
            x={n.cx}
            y={n.cy + 3}
            textAnchor="middle"
            className="fill-foreground"
            fontSize="9"
            fontFamily="ui-sans-serif,system-ui"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function Home() {
  return (
    <main id="top" className="min-h-screen scroll-smooth">
      {/* ================== HERO ================== */}
      <section className="px-gutter pt-section pb-section-lg">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col gap-7">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card/60 px-3 text-caption font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden /> The AI workforce for
                nonprofits
              </span>
            </div>
            <h1 className="font-display text-display tracking-tight text-balance text-foreground">
              The crew you don&rsquo;t have headcount for.
            </h1>
            <p className="max-w-2xl text-body-lg leading-relaxed text-muted-foreground">
              Blinx is a full-stack AI operating system for small and mid-sized
              nonprofits — a six-agent workforce plus the compliance, donor, grant,
              contractor, and inbox modules nonprofits usually stitch together from
              half a dozen subscriptions.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="mailto:blinx@polsia.app?subject=Blinx%20%E2%80%94%20interested">Talk to us</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/#stack">See what replaces</Link>
              </Button>
            </div>
            <dl className="mt-2 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-6 text-small">
              <div>
                <dt className="text-muted-foreground">Agent crew</dt>
                <dd className="mt-1 font-display text-h3 text-foreground">6</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Operating modules</dt>
                <dd className="mt-1 font-display text-h3 text-foreground">9</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Outbound without review</dt>
                <dd className="mt-1 font-display text-h3 text-foreground">0</dd>
              </div>
            </dl>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-brand-500/20 via-transparent to-brand-500/5 blur-2xl" aria-hidden />
            <HeroConstellation />
          </div>
        </div>
      </section>

      {/* ================== THE CREW ================== */}
      <section id="crew" className="border-t border-border bg-card/40 px-gutter py-section-lg">
        <div className="container-page">
          <div className="mb-12 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-end">
            <div>
              <p className="text-eyebrow">The crew</p>
              <h2 className="mt-3 font-display text-h1 tracking-tight text-foreground">
                Six agents. One shared source of truth.
              </h2>
            </div>
            <p className="text-body text-muted-foreground">
              Each agent keeps its own domain memory, runs on its own schedule, and
              trails an audit log. They never email a donor, post to your socials,
              submit a grant, or pay a contractor without your sign-off — every
              outbound action sits in a transparent approval queue with the full
              payload preview.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AGENTS.map((agent) => (
              <article
                key={agent.key}
                className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-primary">
                    <AgentIcon mark={agent.mark} />
                  </span>
                  <Badge variant="outline" className="font-mono text-caption">
                    agent
                  </Badge>
                </div>
                <div>
                  <h3 className="font-display text-h4 text-foreground">{agent.name}</h3>
                  <p className="mt-1 text-small text-muted-foreground">{agent.beat}</p>
                </div>
                <div className="mt-auto flex items-center gap-2 border-t border-border pt-4 text-caption text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                  Own memory · own schedule · own audit log
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================== REPLACE YOUR STACK ================== */}
      <section id="stack" className="px-gutter py-section-lg">
        <div className="container-page">
          <div className="mb-10">
            <p className="text-eyebrow">Replace your stack</p>
            <h2 className="mt-3 font-display text-h1 tracking-tight text-foreground">
              Stop paying for six tools to run one organization.
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
            <div className="bg-card p-8">
              <p className="text-eyebrow text-muted-foreground">What you have today</p>
              <h3 className="mt-2 font-display text-h3 text-foreground">A patchwork.</h3>
              <ul className="mt-6 flex flex-col gap-3">
                {CURRENT_TOOLS.map((t) => (
                  <li
                    key={t.name}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="text-body text-foreground">{t.name}</span>
                    <span className="text-caption text-muted-foreground">{t.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-primary text-primary-foreground p-8">
              <p className="text-eyebrow opacity-80">What Blinx ships</p>
              <h3 className="mt-2 font-display text-h3">One operating system.</h3>
              <ul className="mt-6 flex flex-col gap-3">
                {MODULES.slice(0, 6).map((m) => (
                  <li key={m.tag} className="flex items-center gap-3 border-b border-primary-foreground/20 pb-3 last:border-b-0 last:pb-0">
                    <span className="font-mono text-caption opacity-70">{m.tag}</span>
                    <span className="text-body font-medium">{m.name}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-small opacity-80">
                Plus time logger, domain &amp; SSL monitor, and a Gumroad-ping reserve
                fund — nine modules in total.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================== APPROVALS ================== */}
      <section id="approvals" className="border-t border-border bg-card/40 px-gutter py-section-lg">
        <div className="container-page">
          <div className="mb-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-end">
            <div>
              <p className="text-eyebrow">The approval queue</p>
              <h2 className="mt-3 font-display text-h1 tracking-tight text-foreground">
                Nothing goes out without your review.
              </h2>
            </div>
            <p className="text-body text-muted-foreground">
              Every claim, post, draft, and payout sits in a queue with the full
              payload preview — the email body, the social post, the grant narrative,
              the contractor payment — plus the signals the agent used to draft it.
              Approve, edit, or kill, with one keystroke.
            </p>
          </div>
          <ApprovalTabs items={APPROVALS.map((a) => ({ label: a.label, panel: a }))} />
        </div>
      </section>

      {/* ================== MODULES ================== */}
      <section id="modules" className="px-gutter py-section-lg">
        <div className="container-page">
          <div className="mb-10">
            <p className="text-eyebrow">The modules</p>
            <h2 className="mt-3 font-display text-h1 tracking-tight text-foreground">
              Nine modules an executive director actually needs.
            </h2>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <li key={m.tag} className="flex flex-col gap-2 bg-card p-7">
                <span className="font-mono text-caption text-primary">{m.tag}</span>
                <h3 className="font-display text-h4 text-foreground">{m.name}</h3>
                <p className="text-small text-muted-foreground">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================== COMPLIANCE CALENDAR ================== */}
      <section id="compliance" className="border-t border-border bg-card/40 px-gutter py-section-lg">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div>
              <p className="text-eyebrow">Federal compliance</p>
              <h2 className="mt-3 font-display text-h1 tracking-tight text-foreground">
                Deadlines that auto-seed themselves.
              </h2>
              <p className="mt-6 max-w-xl text-body text-muted-foreground">
                Tell Blinx your entity type once. The compliance calendar populates
                itself with 990, BOI, Form 1023, 1099-NEC, and W-2 obligations —
                state-by-state — and surfaces what&rsquo;s due this quarter
                before it&rsquo;s due.
              </p>
            </div>
            <Card className="overflow-hidden border-border bg-card">
              <CardContent className="p-0">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 border-b border-border bg-muted/40 px-5 py-3 text-caption font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Form</span>
                  <span>What it is</span>
                  <span>Next due</span>
                </div>
                {DEADLINES.map((d, i) => {
                  const isUrgent = d.tone === 'urgent';
                  const isHigh = d.tone === 'high';
                  return (
                    <div
                      key={d.tag}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 border-b border-border px-5 py-4 text-small last:border-b-0"
                    >
                      <span className="font-mono font-semibold text-foreground">{d.tag}</span>
                      <span className="text-muted-foreground">
                        {d.tag === '990' && 'Annual information return'}
                        {d.tag === 'BOI' && 'Beneficial Ownership Information report'}
                        {d.tag === '1099-NEC' && 'Nonemployee compensation'}
                        {d.tag === 'W-2' && 'Wage and tax statement'}
                        {d.tag === 'Form 1023' && 'Tax-exempt status application'}
                        {d.tag === 'State annual' && 'State charity / solicitation renewal'}
                      </span>
                      <Badge
                        variant={isUrgent ? 'destructive' : isHigh ? 'default' : 'secondary'}
                        className="font-mono"
                      >
                        {d.when}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ================== CTA ================== */}
      <section id="pricing" className="px-gutter py-section-lg">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-16 sm:px-12 sm:py-20">
            <div
              className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-brand-500/15 via-transparent to-brand-300/10"
              aria-hidden
            />
            <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div>
                <p className="text-eyebrow">Built for the 90%</p>
                <h2 className="mt-3 font-display text-h1 tracking-tight text-foreground">
                  For the executive director holding the org together with
                  sticky notes and goodwill.
                </h2>
                <p className="mt-5 max-w-2xl text-body-lg text-muted-foreground">
                  Pricing scales with annual budget, not seat count. Bring the rest
                  of your staff, your volunteers, your board — at sub-$1K/year you
                  can run the whole operation.
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                <Button asChild size="lg">
                  <Link href="mailto:blinx@polsia.app?subject=Blinx%E2%80%94get%20in%20touch">
                    Email blinx@polsia.app
                  </Link>
                </Button>
                <p className="text-caption text-muted-foreground">
                  Same inbox for nonprofits + state compliance questions. We respond within one business day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
