"use client";

import { IconPalette } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ACCENT_KEYS, type AccentKey, useAccent } from "@/components/providers/accent-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCENT_LABEL_KEYS: Record<AccentKey, string> = {
  default: "options.default",
  blue: "options.blue",
  green: "options.green",
  orange: "options.orange",
  purple: "options.purple",
};

const ACCENT_SWATCH: Record<AccentKey, { light: string; dark: string }> = {
  default: { light: "#a3a3a3", dark: "#525252" },
  blue: { light: "#2563eb", dark: "#60a5fa" },
  green: { light: "#16a34a", dark: "#4ade80" },
  orange: { light: "#ea580c", dark: "#fb923c" },
  purple: { light: "#9333ea", dark: "#c084fc" },
};

export function AccentToggle() {
  const t = useTranslations("navbar.accent");
  const { accent, setAccent, isReady } = useAccent();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!open) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("label")}
        title={t("label")}
        onClick={() => setOpen((prev) => !prev)}
      >
        <IconPalette className="h-5 w-5" aria-hidden />
      </Button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-1">
            {ACCENT_KEYS.map((key) => {
              const isActive = accent === key;
              const swatch = ACCENT_SWATCH[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setAccent(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800",
                    isActive &&
                      "ring-2 ring-neutral-300 ring-offset-2 ring-offset-white dark:ring-neutral-600 dark:ring-offset-neutral-900"
                  )}
                  disabled={!isReady}
                >
                  {key === "default" ? (
                    <span
                      className="h-4 w-4 rounded-full border border-neutral-300 dark:border-neutral-700 bg-gradient-to-br from-transparent to-transparent"
                      aria-hidden
                    />
                  ) : (
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${swatch.light} 50%, ${swatch.dark} 50%)`,
                      }}
                      aria-hidden
                    />
                  )}
                  <span>{t(ACCENT_LABEL_KEYS[key])}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
