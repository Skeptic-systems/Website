"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { geist } from "@/app/fonts";
import { cn } from "@/lib/utils";

type TerminalEntryStatus = "pending" | "published" | "error";

type TerminalEntry = {
  id: string;
  message: string;
  status: TerminalEntryStatus;
  createdAt: number;
};

type StatusDictionary = {
  pending: string;
  published: string;
  error: string;
};

const TERMINAL_SCROLL_OFFSET = 24;

const createEntryId = (index: number): string => {
  const stamp = Date.now().toString(36);
  const suffix = Math.abs(index).toString(36);
  return `${stamp}-${suffix}`;
};

export function Terminal() {
  const t = useTranslations("terminal");
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const statusLabels = useMemo(() => {
    return t.raw("statuses") as StatusDictionary;
  }, [t]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const entryCount = entries.length;

  useEffect(() => {
    const node = logRef.current;
    if (!node) {
      return;
    }
    if (entryCount === 0) {
      return;
    }
    node.scrollTo({
      top: node.scrollHeight + TERMINAL_SCROLL_OFFSET,
      behavior: "smooth",
    });
  }, [entryCount]);

  const queueSubmission = useCallback(async (entry: TerminalEntry) => {
    try {
      await Promise.resolve();
      setEntries((previous) =>
        previous.map((item) =>
          item.id === entry.id ? { ...item, status: "pending" } : item,
        ),
      );
    } catch {
      setEntries((previous) =>
        previous.map((item) =>
          item.id === entry.id ? { ...item, status: "error" } : item,
        ),
      );
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = inputValue.trim();

      if (trimmed.length === 0) {
        setErrorMessage(t("messages.emptyInput"));
        return;
      }

      const nextEntry: TerminalEntry = {
        id: createEntryId(entryCount),
        message: trimmed,
        status: "pending",
        createdAt: Date.now(),
      };

      setEntries((previous) => [...previous, nextEntry]);
      setInputValue("");
      setErrorMessage(null);

      await queueSubmission(nextEntry);
    },
    [entryCount, inputValue, queueSubmission, t],
  );

  const promptLabel = t("prompt");
  const systemPromptLabel = t("systemPrompt");
  const welcomeLine = t("welcomeLine");
  const systemIntroLine = t("systemIntroLine");

  const renderedEntries = useMemo(
    () =>
      [
        {
          id: "system-intro",
          prompt: systemPromptLabel,
          content: systemIntroLine,
          status: "published" as const,
          withPrompt: true,
        },
        ...entries.map((entry) => ({
          id: entry.id,
          prompt: promptLabel,
          content: entry.message,
          status: entry.status,
          withPrompt: true,
        })),
      ] satisfies Array<{
        id: string;
        prompt: string;
        content: string;
        status: TerminalEntryStatus;
        withPrompt: boolean;
      }>,
    [entries, promptLabel, systemIntroLine, systemPromptLabel],
  );

  return (
    <section
      id="terminal"
      className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen overflow-hidden"
    >
      <div className="absolute inset-0 [background-size:40px_40px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]" />
      <div className="accent-glow-layer" />
      <div className="accent-glow-layer-right" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative z-10 flex min-h-[40vh] flex-col items-center justify-center px-6 pt-24 sm:pt-28 md:pt-32">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <span
            className={cn(
              geist.className,
              "text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400",
            )}
          >
            {t("accent")}
          </span>
          <h2
            className={cn(
              geist.className,
              "mt-4 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl dark:text-neutral-50",
            )}
          >
            {t("title")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-300">
            {t("description")}
          </p>
        </div>
      </div>
      <div className="relative z-10 px-6 pb-28">
        <motion.div
          layout
          className="mx-auto mt-16 w-full max-w-4xl rounded-[28px] border border-neutral-200/70 bg-white/90 p-6 shadow-[0_40px_130px_-80px_rgba(15,23,42,0.65)] backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-900/80 dark:shadow-[0_50px_140px_-80px_rgba(15,23,42,0.75)]"
        >
          <div className="rounded-2xl border border-neutral-200/80 bg-neutral-900 text-neutral-100 shadow-inner dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center rounded-t-2xl border-b border-neutral-800/60 bg-neutral-900 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-3 w-3 rounded-full bg-red-500/80" />
                <span className="inline-flex h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex flex-1 items-center justify-center">
                <span className="font-mono text-[0.7rem] text-neutral-400">{welcomeLine}</span>
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-400">
                {t("windowTitle")}
              </span>
            </div>

            <div className="flex max-h-[380px] flex-col gap-3 overflow-y-auto px-5 py-6 font-mono text-[0.82rem] leading-relaxed text-neutral-100 sm:text-sm" ref={logRef}>
              {renderedEntries.map((entry) => (
                <TerminalLine
                  key={entry.id}
                  prompt={entry.prompt}
                  content={entry.content}
                  status={entry.status}
                  statusLabels={statusLabels}
                  withPrompt={entry.withPrompt}
                />
              ))}
            </div>

            <form
              className="flex items-center gap-3 border-t border-neutral-800/60 bg-neutral-900/80 px-5 py-4 font-mono text-sm text-neutral-100"
              onSubmit={handleSubmit}
            >
              <span className="whitespace-nowrap text-sky-300">{promptLabel}</span>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={t("inputPlaceholder")}
                className="flex-1 bg-transparent text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                aria-label={t("inputAriaLabel")}
              />
              <button
                type="submit"
                className="rounded-lg border border-sky-500/60 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200 transition hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
              >
                {t("submit")}
              </button>
            </form>
          </div>
          {errorMessage ? (
            <p className="mt-3 text-center text-sm text-rose-500">{errorMessage}</p>
          ) : null}
          <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
            {t("moderationHint")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

type TerminalLineProps = {
  prompt: string;
  content: string;
  status: TerminalEntryStatus;
  statusLabels: StatusDictionary;
  withPrompt: boolean;
};

function TerminalLine({ prompt, content, status, statusLabels, withPrompt }: TerminalLineProps) {
  const showPrompt = withPrompt ? "opacity-100" : "opacity-0";
  const statusBadge =
    status !== "published" ? (
      <span
        className={cn(
          "justify-self-end rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em]",
          status === "pending"
            ? "bg-amber-500/10 text-amber-300"
            : "bg-rose-500/10 text-rose-300",
        )}
      >
        {statusLabels[status]}
      </span>
    ) : (
      <span aria-hidden className="h-4 w-0" />
    );

  return (
    <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1">
      <span className={cn("whitespace-nowrap text-sky-300 transition-opacity", showPrompt)} aria-hidden={!withPrompt}>
        {prompt}
      </span>
      <span className="text-neutral-100">{content}</span>
      {statusBadge}
    </div>
  );
}


