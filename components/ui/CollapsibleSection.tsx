"use client";

import { useState } from "react";

interface Props {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, subtitle, badge, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-baseline gap-3">
          <span className="text-base font-semibold text-zinc-900">{title}</span>
          {subtitle && <span className="text-xs text-zinc-500">{subtitle}</span>}
        </span>
        <span className="flex items-center gap-3">
          {badge}
          <span className="text-zinc-400">{open ? "▾" : "▸"}</span>
        </span>
      </button>
      {open && <div className="border-t border-zinc-100 px-5 py-4">{children}</div>}
    </section>
  );
}
