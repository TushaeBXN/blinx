// @polsia:user-owned — interactive approval-queue tabs for the homepage.
// Client component because Tabs requires state.

'use client';

import { Check, Eye, Pencil, X } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ApprovalItem {
  label: string;
  panel: {
    label: string;
    title: string;
    preview: {
      to: string;
      subject: string;
      preview: string;
      signals: readonly string[];
    };
  };
}

export function ApprovalTabs({ items }: { items: ApprovalItem[] }) {
  return (
    <Tabs defaultValue={items[0]?.label} className="w-full">
      <div className="overflow-x-auto">
        <TabsList className="inline-flex h-auto w-auto flex-wrap gap-1 bg-muted/60 p-1">
          {items.map((it) => (
            <TabsTrigger key={it.label} value={it.label} className="text-small">
              {it.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {items.map((it) => (
        <TabsContent key={it.label} value={it.label} className="mt-6">
          <article className="grid gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-2 rounded-full bg-primary" aria-hidden />
                <p className="text-caption font-semibold uppercase tracking-wider text-primary">
                  Awaiting approval · {it.panel.label}
                </p>
              </div>
              <h3 className="font-display text-h3 leading-tight text-foreground">
                {it.panel.title}
              </h3>
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-small">
                  <dt className="text-muted-foreground">To</dt>
                  <dd className="font-mono text-foreground">{it.panel.preview.to}</dd>
                  <dt className="text-muted-foreground">Subject</dt>
                  <dd className="text-foreground">{it.panel.preview.subject}</dd>
                </dl>
              </div>
              <blockquote className="rounded-lg border-l-2 border-primary bg-background/60 p-4 text-small leading-relaxed text-foreground/90">
                {it.panel.preview.preview}
              </blockquote>
            </div>
            <div className="flex flex-col gap-4 lg:border-l lg:border-border lg:pl-6">
              <div>
                <p className="text-eyebrow text-muted-foreground">Agent signals</p>
                <ul className="mt-3 flex flex-col gap-2 text-small">
                  {it.panel.preview.signals.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-foreground">
                      <span
                        className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-primary"
                        aria-hidden
                      />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto flex flex-col gap-2">
                <Button size="sm" className="w-full justify-center">
                  <Check className="size-4" /> Approve
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" variant="outline" className="w-full">
                    <Pencil className="size-4" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="w-full">
                    <Eye className="size-4" /> Preview
                  </Button>
                  <Button size="sm" variant="outline" className="w-full">
                    <X className="size-4" /> Kill
                  </Button>
                </div>
                <p className="text-caption text-muted-foreground">
                  Every approval is logged with payload diff, actor, and timestamp.
                </p>
              </div>
            </div>
          </article>
        </TabsContent>
      ))}
    </Tabs>
  );
}
