import * as React from "react";

import { cn } from "@/lib/utils";

type GlowTileProps = {
  label: string;
  glowFrom: string;
  glowTo: string;
  ringColor: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export function GlowTile({
  label,
  glowFrom,
  glowTo,
  ringColor,
  icon,
  children,
  className,
  ...props
}: GlowTileProps) {
  return (
    <div {...props} className={cn("group relative h-full", className)}>
      <div
        className="pointer-events-none absolute -inset-1 rounded-[26px] opacity-0 blur-3xl transition-opacity duration-300 ease-out group-hover:opacity-100"
        style={{ background: `linear-gradient(180deg, ${glowFrom}, ${glowTo})` }}
      />
      <div className="relative h-full rounded-[22px] border border-neutral-200/80 bg-white/90 text-neutral-900 shadow-[0_25px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-sm p-8 text-center transition-all duration-300 ease-out group-hover:-translate-y-1 dark:border-slate-800/60 dark:bg-neutral-950/70 dark:text-neutral-100 dark:shadow-none">
        <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-neutral-200/70 dark:ring-slate-800/60" />
        <div
          className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1px ${ringColor}` }}
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          style={{ background: `radial-gradient(60% 60% at 50% 0%, ${glowFrom}22, transparent 70%)` }}
        />
        {icon ? (
          <div className="relative z-10 mb-6 flex items-center justify-center">
            <div className="relative rounded-2xl border border-neutral-200/70 bg-white/90 p-2 dark:border-slate-800/60 dark:bg-neutral-900/80">
              <div className="rounded-xl bg-neutral-100 p-3 text-neutral-700 ring-1 ring-inset ring-neutral-200/80 dark:bg-neutral-800/60 dark:text-neutral-200 dark:ring-slate-700/50">
                {icon}
              </div>
            </div>
          </div>
        ) : null}
        <div className="relative z-10">
          {children ? (
            children
          ) : (
            <div className="flex h-20 items-center justify-center">
              <span className="text-base sm:text-lg font-medium">{label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


