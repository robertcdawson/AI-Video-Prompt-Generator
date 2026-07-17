"use client";

import { useState } from "react";

/**
 * Disclosure chevron sized for touch: the icon sits in a 45x45px box so the
 * arrow itself is a comfortable mobile target even though the whole header
 * row also toggles. Decorative only — the button carries aria-expanded.
 */
export function DisclosureChevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full text-zinc-500"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-6 w-6 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

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
        aria-expanded={open}
        className="flex min-h-[45px] w-full items-center justify-between gap-3 py-2 pl-5 pr-2 text-left"
      >
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="text-lg font-semibold text-zinc-900">{title}</span>
          {subtitle && <span className="text-sm text-zinc-500">{subtitle}</span>}
        </span>
        <span className="flex items-center gap-2">
          {badge}
          <DisclosureChevron open={open} />
        </span>
      </button>
      {open && <div className="border-t border-zinc-100 px-5 py-4">{children}</div>}
    </section>
  );
}
