"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { geist } from "@/app/fonts";
import { cn } from "@/lib/utils";
import { requestJson } from "@/lib/request";

type TerminalEntryStatus = "pending" | "published" | "error";

type TerminalEntry = {
  id: string;
  message: string;
  status: TerminalEntryStatus;
  createdAt: number;
};

type TerminalMessage = {
  id: string;
  textDefault: string;
  textEn: string;
  textDe: string;
  createdAt: string;
};

type LanguageKey = "default" | "en" | "de";

type TerminalSessionResponse = {
  id: string;
  textCount: number;
  textLimit: number;
  createdAt: string;
  expiresAt: string;
};

type StatusDictionary = {
  pending: string;
  published: string;
  error: string;
};

type LanguageOptions = {
  default: string;
  en: string;
  de: string;
};

type PostMessageProcessed = {
  status: "processed";
  reason: string;
  message: TerminalMessage;
};

type PostMessageRejected = {
  status: "rejected";
  reason: string;
};

type PostMessageQueued = {
  status: "queued";
};

type PostMessageError = {
  error: string;
  reason?: string;
};

type PostMessageEnvelope =
  | (PostMessageProcessed & { session: TerminalSessionResponse })
  | (PostMessageRejected & { session: TerminalSessionResponse })
  | (PostMessageQueued & { session: TerminalSessionResponse })
  | (PostMessageError & { session?: TerminalSessionResponse });

const TERMINAL_SCROLL_OFFSET = 24;
const languageOrder: LanguageKey[] = ["default", "de", "en"];

const createEntryId = (index: number): string => {
  const stamp = Date.now().toString(36);
  const suffix = Math.abs(index).toString(36);
  return `${stamp}-${suffix}`;
};

export function Terminal() {
  const t = useTranslations("terminal");
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [publishedMessages, setPublishedMessages] = useState<TerminalMessage[]>([]);
  const [sessionInfo, setSessionInfo] = useState<TerminalSessionResponse | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [feedLanguage, setFeedLanguage] = useState<LanguageKey>("default");
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const statusLabels = useMemo(() => {
    return t.raw("statuses") as StatusDictionary;
  }, [t]);

  const languageOptions = useMemo(() => {
    return t.raw("languageOptions") as LanguageOptions;
  }, [t]);

  const isRateLimited = useMemo(() => {
    if (!sessionInfo) {
      return false;
    }

    return sessionInfo.textCount >= sessionInfo.textLimit;
  }, [sessionInfo]);

  useEffect(() => {
    if (!sessionInfo) {
      return;
    }

    const atLimit = sessionInfo.textCount >= sessionInfo.textLimit;

    setFeedback((previous) => {
      const isRateLimitFeedback =
        previous?.tone === "error" && previous.text === t("messages.rateLimited");

      if (atLimit) {
        if (isRateLimitFeedback) {
          return previous;
        }
        return { tone: "error", text: t("messages.rateLimited") };
      }

      if (isRateLimitFeedback) {
        return null;
      }

      return previous;
    });
  }, [sessionInfo, t]);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;

    if (!apiBase) {
      console.error("Missing NEXT_PUBLIC_API_URL environment variable");
      return;
    }

    const abortController = new AbortController();

    void (async () => {
      const session = await requestJson<TerminalSessionResponse>(`${apiBase}/terminal/session`, {
        credentials: "include",
        signal: abortController.signal,
      });

      if (!session) {
        console.error("Failed to initialize terminal session");
        return;
      }

      setSessionInfo(session);
    })();

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;

    if (!apiBase) {
      return;
    }

    const abortController = new AbortController();

    void (async () => {
      const feed = await requestJson<{ items: TerminalMessage[] }>(`${apiBase}/terminal/messages?limit=50`, {
        credentials: "include",
        signal: abortController.signal,
      });

      if (feed?.items) {
        const ordered = [...feed.items].reverse();
        setPublishedMessages(ordered);
      }
    })();

    return () => {
      abortController.abort();
    };
  }, []);

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

  const updateEntryStatus = useCallback((entryId: string, status: TerminalEntryStatus) => {
    setEntries((previous) =>
      previous.map((item) => (item.id === entryId ? { ...item, status } : item)),
    );
  }, []);

  const removeEntry = useCallback((entryId: string) => {
    setEntries((previous) => previous.filter((item) => item.id !== entryId));
  }, []);

  const queueSubmission = useCallback(
    async (entry: TerminalEntry) => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;

      if (!apiBase) {
        updateEntryStatus(entry.id, "error");
        setFeedback({ tone: "error", text: t("messages.submitFailed") });
        return;
      }

      if (sessionInfo && sessionInfo.textCount >= sessionInfo.textLimit) {
        updateEntryStatus(entry.id, "error");
        setFeedback({ tone: "error", text: t("messages.rateLimited") });
        return;
      }

      try {
        const response = await fetch(`${apiBase}/terminal/message`, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: entry.message }),
        });

        const payload = (await response.json().catch(() => null)) as PostMessageEnvelope | null;

        if (payload && "session" in payload && payload.session) {
          setSessionInfo(payload.session);
        }

        if (response.status === 429) {
          updateEntryStatus(entry.id, "error");
          setFeedback({ tone: "error", text: t("messages.rateLimited") });
          return;
        }

        if (response.status === 401) {
          updateEntryStatus(entry.id, "error");
          setSessionInfo(null);
          setFeedback({ tone: "error", text: t("messages.unauthorized") });
          return;
        }

        if (payload && "status" in payload) {
          const reachedLimit = payload.session.textCount >= payload.session.textLimit;

          if (payload.status === "processed") {
          removeEntry(entry.id);
            setPublishedMessages((previous) => {
              const filtered = previous.filter((item) => item.id !== payload.message.id);
              return [...filtered, payload.message];
            });
            setFeedback(
              reachedLimit
                ? { tone: "error", text: t("messages.rateLimited") }
                : { tone: "success", text: t("messages.approved", { reason: payload.reason }) },
            );
            return;
          }

          if (payload.status === "rejected") {
          removeEntry(entry.id);
            setFeedback(
              reachedLimit
                ? { tone: "error", text: t("messages.rateLimited") }
                : { tone: "error", text: t("messages.rejected", { reason: payload.reason }) },
            );
            return;
          }

          updateEntryStatus(entry.id, "pending");
          return;
        }

        if (!payload || !response.ok) {
          updateEntryStatus(entry.id, "error");
          setFeedback({ tone: "error", text: t("messages.submitFailed") });
          return;
        }

        if (payload && "error" in payload) {
          updateEntryStatus(entry.id, "error");
          console.error("Terminal submission failed", payload);
          setFeedback({ tone: "error", text: t("messages.submitFailed") });
          return;
        }

        updateEntryStatus(entry.id, "pending");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        updateEntryStatus(entry.id, "error");
        setFeedback({ tone: "error", text: t("messages.submitFailed") });
      }
    },
    [removeEntry, sessionInfo, t, updateEntryStatus],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isRateLimited) {
        setFeedback({ tone: "error", text: t("messages.rateLimited") });
        return;
      }
      const trimmed = inputValue.trim();

      if (trimmed.length === 0) {
        setFeedback({ tone: "error", text: t("messages.emptyInput") });
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
      setFeedback(null);

      await queueSubmission(nextEntry);
    },
    [entryCount, inputValue, isRateLimited, queueSubmission, t],
  );

  const promptLabel = t("prompt");
  const systemPromptLabel = t("systemPrompt");
  const communityPromptLabel = t("communityPrompt");
  const languageLabel = t("languageLabel");
  const sessionUsageText = sessionInfo
    ? t("sessionUsage", { used: sessionInfo.textCount, limit: sessionInfo.textLimit })
    : null;
  const welcomeLine = t("welcomeLine");
  const systemIntroLine = t("systemIntroLine");

  const selectFeedText = useCallback(
    (message: TerminalMessage): string => {
      const sanitized = message.textDefault.trim();

      if (feedLanguage === "de") {
        const german = message.textDe.trim();
        return german.length > 0 ? german : sanitized;
      }

      if (feedLanguage === "en") {
        const english = message.textEn.trim();
        return english.length > 0 ? english : sanitized;
      }

      return sanitized;
    },
    [feedLanguage],
  );

  const renderedEntries = useMemo(
    () => {
      const feedEntries = publishedMessages
        .slice()
        .sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        .map((message) => ({
          id: `feed-${message.id}`,
          prompt: communityPromptLabel,
          content: selectFeedText(message),
          status: "published" as const,
          withPrompt: true,
        }));

      const userEntries = entries.map((entry) => ({
        id: entry.id,
        prompt: promptLabel,
        content: entry.message,
        status: entry.status,
        withPrompt: true,
      }));

      return [
        {
          id: "system-intro",
          prompt: systemPromptLabel,
          content: systemIntroLine,
          status: "published" as const,
          withPrompt: true,
        },
        ...feedEntries,
        ...userEntries,
      ] satisfies Array<{
        id: string;
        prompt: string;
        content: string;
        status: TerminalEntryStatus;
        withPrompt: boolean;
      }>;
    },
    [communityPromptLabel, entries, promptLabel, publishedMessages, selectFeedText, systemIntroLine, systemPromptLabel],
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/60 bg-neutral-900/80 px-5 py-3">
              <span className="text-xs text-neutral-500">
                {sessionUsageText ?? " "}
              </span>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="terminal-language"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400"
                >
                  {languageLabel}
                </label>
                <select
                  id="terminal-language"
                  value={feedLanguage}
                  onChange={(event) => setFeedLanguage(event.target.value as LanguageKey)}
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs font-medium text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
                >
                  {languageOrder.map((language) => (
                    <option key={language} value={language}>
                      {languageOptions[language]}
                    </option>
                  ))}
                </select>
              </div>
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
                disabled={isRateLimited}
              />
              <button
                type="submit"
                className={cn(
                  "rounded-lg border border-sky-500/60 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200 transition",
                  "hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900",
                  isRateLimited ? "cursor-not-allowed opacity-60 hover:bg-sky-500/10" : undefined,
                )}
                disabled={isRateLimited}
              >
                {t("submit")}
              </button>
            </form>
          </div>
          {feedback ? (
            <p
              className={cn("mt-3 text-center text-sm", feedback.tone === "success" ? "text-emerald-500" : "text-rose-500")}
            >
              {feedback.text}
            </p>
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


