"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Flag } from "phosphor-react";

import { geist } from "@/app/fonts";
import {
  gsapSectionConfig,
  type GsapSectionSetup,
  useGsapSection,
} from "@/lib/gsap-animations";
import { cn } from "@/lib/utils";
import { requestJson } from "@/lib/request";
import { sectionHeadingClass } from "@/components/common/section-heading";
import { useSectionIntersection } from "@/lib/use-section-intersection";

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
  reportCount: number;
};

type ReportReason = "personal_information" | "hate_speech" | "other";

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
const reportReasonOrder: ReportReason[] = ["personal_information", "hate_speech", "other"];

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
  const [reportTarget, setReportTarget] = useState<{ id: string; preview: string } | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("personal_information");
  const [reportDescription, setReportDescription] = useState("");
  const [reportFeedback, setReportFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const shouldLoadTerminal = useSectionIntersection("terminal", { rootMargin: "35%" });

  const statusLabels = useMemo(() => {
    return t.raw("statuses") as StatusDictionary;
  }, [t]);

  const languageOptions = useMemo(() => {
    return t.raw("languageOptions") as LanguageOptions;
  }, [t]);

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

  const reportReasonLabels = useMemo(() => {
    return t.raw("report.reasons") as Record<ReportReason, string>;
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
    if (!shouldLoadTerminal) {
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL;

    if (!apiBase) {
      console.error("Missing NEXT_PUBLIC_API_URL environment variable");
      return;
    }

    const abortController = new AbortController();
    let isActive = true;

    const attemptSessionInitialization = async (attempt: number): Promise<void> => {
      const session = await requestJson<TerminalSessionResponse>(`${apiBase}/terminal/session`, {
        credentials: "include",
        signal: abortController.signal,
      });

      if (!isActive || abortController.signal.aborted) {
        return;
      }

      if (session) {
        setSessionInfo(session);
        return;
      }

      if (attempt < 3) {
        const delay = 400 * attempt;
        window.setTimeout(() => {
          if (!abortController.signal.aborted) {
            void attemptSessionInitialization(attempt + 1);
          }
        }, delay);
        return;
      }

      console.warn("Terminal session initialization failed after multiple attempts");
      setFeedback({ tone: "error", text: t("messages.sessionInitFailed") });
    };

    void attemptSessionInitialization(1);

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [shouldLoadTerminal, t]);

  useEffect(() => {
    if (!shouldLoadTerminal) {
      return;
    }

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
  }, [shouldLoadTerminal]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const focusInput = () => {
      inputRef.current?.focus();
    };

    if (window.location.hash === "#terminal") {
      focusInput();
    }

    const handleHashChange = () => {
      if (window.location.hash === "#terminal") {
        focusInput();
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
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

  const handleReportSelect = useCallback(
    (message: TerminalMessage) => {
      setReportTarget({
        id: message.id,
        preview: selectFeedText(message),
      });
      setReportReason("personal_information");
      setReportDescription("");
      setReportFeedback(null);
      setReportError(null);
    },
    [selectFeedText],
  );

  const handleReportCancel = useCallback(() => {
    setReportTarget(null);
    setReportDescription("");
    setReportReason("personal_information");
    setReportFeedback(null);
    setReportError(null);
    setIsSubmittingReport(false);
  }, []);

  const handleReportSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!reportTarget) {
        return;
      }

      const trimmedDescription = reportDescription.trim();

      if (trimmedDescription.length < 10) {
        setReportError(t("report.validation.description"));
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL;

      if (!apiBase) {
        setReportError(t("report.feedback.error"));
        return;
      }

      setIsSubmittingReport(true);
      setReportError(null);
      setReportFeedback(null);

      try {
        const response = await fetch(`${apiBase}/terminal/messages/${reportTarget.id}/report`, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: reportReason,
            description: trimmedDescription,
          }),
        });

        const payload = (await response.json().catch(() => null)) as { reportCount?: number } | { error?: string } | null;

        if (response.status === 401) {
          setReportError(t("report.feedback.sessionMissing"));
          return;
        }

        if (response.status === 404) {
          setReportError(t("report.feedback.notFound"));
          return;
        }

        if (response.status === 409) {
          setReportError(t("report.feedback.duplicate"));
          return;
        }

        if (!payload || typeof (payload as { reportCount?: number }).reportCount !== "number") {
          setReportError(t("report.feedback.error"));
          return;
        }

        const { reportCount } = payload as { reportCount: number };

        setPublishedMessages((previous) =>
          previous.map((message) =>
            message.id === reportTarget.id ? { ...message, reportCount } : message,
          ),
        );
        setReportFeedback({ tone: "success", text: t("report.feedback.success") });
        setReportTarget(null);
        setReportDescription("");
        setReportReason("personal_information");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setReportError(t("report.feedback.error"));
      } finally {
        setIsSubmittingReport(false);
      }
    },
    [reportDescription, reportReason, reportTarget, setPublishedMessages, t],
  );

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
  const reportActionLabel = t("report.action");
  const reportPanelTitle = t("report.title");
  const reportPlaceholder = t("report.placeholder");
  const reportReasonLabel = t("report.reasonLabel");
  const reportDescriptionLabel = t("report.descriptionLabel");
  const reportPreviewLabel = t("report.previewLabel");
  const reportSubmitLabel = t("report.actions.submit");
  const reportCancelLabel = t("report.actions.cancel");
  const reportSubmittingLabel = t("report.actions.submitting");
  const reportDescriptionPlaceholder = t("report.descriptionPlaceholder");
  const getReportFlagAria = useCallback(
    (count: number) => t("report.flagAria", { count }),
    [t],
  );
  const sessionUsageText = sessionInfo
    ? t("sessionUsage", { used: sessionInfo.textCount, limit: sessionInfo.textLimit })
    : null;
  const welcomeLine = t("welcomeLine");
  const systemIntroLine = t("systemIntroLine");

  const renderedEntries = useMemo(() => {
    const feedEntries = publishedMessages
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((message) => ({
        id: `feed-${message.id}`,
        prompt: communityPromptLabel,
        content: selectFeedText(message),
        status: "published" as const,
        withPrompt: true,
        reportMeta: {
          count: message.reportCount,
          onSelect: () => handleReportSelect(message),
        },
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
      reportMeta?: {
        count: number;
        onSelect: () => void;
      };
    }>;
  }, [
    communityPromptLabel,
    entries,
    handleReportSelect,
    promptLabel,
    publishedMessages,
    selectFeedText,
    systemIntroLine,
    systemPromptLabel,
  ]);

  const terminalAnimation = useCallback<GsapSectionSetup<HTMLDivElement>>(({ node, gsap }) => {
    const { triggerStart, ease } = gsapSectionConfig;
    const fadeIn = (element: HTMLElement | null, start: string = triggerStart) => {
      if (!element) {
        return;
      }
      gsap.fromTo(
        element,
        { y: 40, opacity: 0, filter: "blur(8px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.78,
          ease,
          scrollTrigger: {
            trigger: element,
            start,
            once: true,
          },
          clearProps: "all",
        },
      );
    };

    fadeIn(node.querySelector<HTMLElement>("[data-animate='section-accent']"), "top 85%");
    fadeIn(node.querySelector<HTMLElement>("[data-animate='section-heading']"));

    const copies = node.querySelectorAll<HTMLElement>("[data-animate='section-copy']");
    copies.forEach((copy, index) => {
      fadeIn(copy, index === 0 ? "top 82%" : "top 80%");
    });

    const shell = node.querySelector<HTMLElement>("[data-animate='terminal-shell']");
    if (shell) {
      gsap.fromTo(
        shell,
        { y: 80, opacity: 0, scale: 0.92, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease,
          scrollTrigger: {
            trigger: shell,
            start: "top 78%",
            once: true,
          },
          clearProps: "transform,opacity",
        },
      );
    }
  }, []);
  const sectionRef = useGsapSection<HTMLDivElement>(terminalAnimation);

  return (
    <section
      ref={sectionRef}
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
            data-animate="section-accent"
            className={cn(
              geist.className,
              "text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400",
            )}
          >
            {t("accent")}
          </span>
          <h2
            data-animate="section-heading"
            className={sectionHeadingClass("mt-4 text-neutral-900 dark:text-neutral-50")}
          >
            {t("title")}
          </h2>
          <p
            data-animate="section-copy"
            className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-300"
          >
            {t("description")}
          </p>
        </div>
      </div>
      <div className="relative z-10 px-6 pb-28">
        <motion.div
          data-animate="terminal-shell"
          layout
          className="mx-auto mt-16 w-full max-w-4xl rounded-[28px] border border-neutral-200/70 bg-white/90 p-6 shadow-[0_40px_130px_-80px_rgba(15,23,42,0.65)] backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-900/80 dark:shadow-[0_50px_140px_-80px_rgba(15,23,42,0.75)]"
        >
          <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50 text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-t-2xl border-b border-neutral-200/70 bg-neutral-100 px-4 py-3 text-neutral-500 sm:flex-nowrap dark:border-neutral-800/60 dark:bg-neutral-900 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-3 w-3 rounded-full bg-red-500/80" />
                <span className="inline-flex h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="order-3 w-full font-mono text-[0.7rem] text-neutral-500 sm:order-none sm:flex-1 sm:text-center dark:text-neutral-400">
                {welcomeLine}
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500 sm:text-right dark:text-neutral-400">
                {t("windowTitle")}
              </span>
            </div>
            <div className="flex flex-col gap-3 border-b border-neutral-200/70 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800/60 dark:bg-neutral-900/80">
              <span className="text-xs text-neutral-500 sm:text-left dark:text-neutral-400">
                {sessionUsageText ?? " "}
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
                <label
                  htmlFor="terminal-language"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400"
                >
                  {languageLabel}
                </label>
                <select
                  id="terminal-language"
                  value={feedLanguage}
                  onChange={(event) => setFeedLanguage(event.target.value as LanguageKey)}
                  className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus-visible:ring-offset-neutral-900"
                >
                  {languageOrder.map((language) => (
                    <option key={language} value={language}>
                      {languageOptions[language]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              className="flex max-h-[380px] flex-col gap-3 overflow-y-auto bg-neutral-50 px-4 py-5 font-mono text-[0.82rem] leading-relaxed text-neutral-800 sm:px-5 sm:py-6 sm:text-sm dark:bg-neutral-900 dark:text-neutral-100"
              ref={logRef}
            >
              {renderedEntries.map((entry) => (
                <TerminalLine
                  key={entry.id}
                  prompt={entry.prompt}
                  content={entry.content}
                  status={entry.status}
                  statusLabels={statusLabels}
                  withPrompt={entry.withPrompt}
                  reportMeta={
                    entry.reportMeta
                      ? {
                          count: entry.reportMeta.count,
                          onSelect: entry.reportMeta.onSelect,
                          actionLabel: reportActionLabel,
                          flagAriaLabel: getReportFlagAria(entry.reportMeta.count),
                        }
                      : undefined
                  }
                />
              ))}
            </div>

            <div className="border-t border-neutral-200/70 bg-white px-5 py-4 text-sm text-neutral-800 dark:border-neutral-800/60 dark:bg-neutral-900/80 dark:text-neutral-100">
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                    {reportPanelTitle}
                  </span>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {reportTarget ? t("report.selected", { id: reportTarget.id }) : reportPlaceholder}
                  </p>
                </div>
                {reportTarget ? (
                  <>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("report.notice")}</p>
                    <form className="space-y-3" onSubmit={handleReportSubmit}>
                    <div className="rounded-2xl border border-neutral-200/70 bg-white/80 p-3 text-neutral-700 dark:border-neutral-800/70 dark:bg-neutral-900/70 dark:text-neutral-200">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                        {reportPreviewLabel}
                      </span>
                      <p className="mt-2 text-sm text-neutral-900 dark:text-neutral-100">{reportTarget.preview}</p>
                    </div>
                    <label className="flex flex-col gap-2 text-left">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                        {reportReasonLabel}
                      </span>
                      <select
                        value={reportReason}
                        onChange={(event) => setReportReason(event.target.value as ReportReason)}
                        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus-visible:ring-offset-neutral-900"
                      >
                        {reportReasonOrder.map((reasonKey) => (
                          <option key={reasonKey} value={reasonKey}>
                            {reportReasonLabels[reasonKey]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2 text-left">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                        {reportDescriptionLabel}
                      </span>
                      <textarea
                        value={reportDescription}
                        onChange={(event) => setReportDescription(event.target.value)}
                        rows={3}
                        placeholder={reportDescriptionPlaceholder}
                        className="w-full rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
                      />
                    </label>
                    {reportError ? (
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{reportError}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className={cn(
                          "rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 transition dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200",
                          isSubmittingReport ? "opacity-60" : undefined,
                        )}
                        disabled={isSubmittingReport}
                      >
                        {isSubmittingReport ? reportSubmittingLabel : reportSubmitLabel}
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
                        onClick={handleReportCancel}
                        disabled={isSubmittingReport}
                      >
                        {reportCancelLabel}
                      </button>
                    </div>
                    </form>
                  </>
                ) : null}
                {reportFeedback ? (
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      reportFeedback.tone === "success" ? "text-emerald-500" : "text-rose-500",
                    )}
                  >
                    {reportFeedback.text}
                  </p>
                ) : null}
              </div>
            </div>

            <form
              className="flex flex-col gap-3 border-t border-neutral-200/70 bg-white px-5 py-4 font-mono text-sm text-neutral-800 sm:flex-row sm:items-center sm:gap-4 sm:py-5 dark:border-neutral-800/60 dark:bg-neutral-900/80 dark:text-neutral-100"
              onSubmit={handleSubmit}
            >
              <span className="w-full whitespace-pre-wrap break-all text-xs text-sky-700 sm:w-auto sm:flex-shrink-0 sm:text-sm sm:whitespace-nowrap dark:text-sky-300">
                {promptLabel}
              </span>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={t("inputPlaceholder")}
                className="w-full min-w-0 flex-1 rounded-md bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:rounded-none dark:bg-transparent dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus-visible:ring-offset-neutral-900"
                aria-label={t("inputAriaLabel")}
                disabled={isRateLimited}
              />
              <button
                type="submit"
                className={cn(
                  "w-full rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 transition sm:w-auto sm:py-2",
                  "hover:bg-sky-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20 dark:focus-visible:ring-offset-neutral-900",
                  isRateLimited ? "cursor-not-allowed opacity-60 hover:bg-sky-500/15 dark:hover:bg-sky-500/10" : undefined,
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
  reportMeta?: {
    count: number;
    onSelect: () => void;
    actionLabel: string;
    flagAriaLabel: string;
  };
};

function TerminalLine({ prompt, content, status, statusLabels, withPrompt, reportMeta }: TerminalLineProps) {
  const showPrompt = withPrompt ? "opacity-100" : "opacity-0";
  const statusBadge =
    status !== "published" ? (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em]",
          status === "pending"
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
            : "bg-rose-500/10 text-rose-600 dark:text-rose-300",
        )}
      >
        {statusLabels[status]}
      </span>
    ) : null;

  const reportButton = reportMeta ? (
    <button
      type="button"
      onClick={reportMeta.onSelect}
      aria-label={`${reportMeta.actionLabel}. ${reportMeta.flagAriaLabel}`}
      title={reportMeta.actionLabel}
      className="relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300/70 text-neutral-500 transition hover:border-rose-400 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-rose-300"
    >
      <Flag size={12} weight="fill" aria-hidden />
      {reportMeta.count > 0 ? (
        <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 text-[0.55rem] font-semibold text-white dark:bg-rose-400">
          {reportMeta.count}
        </span>
      ) : null}
    </button>
  ) : null;

  return (
    <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <span
        className={cn(
          "whitespace-pre-wrap break-words text-xs text-sky-700 transition-opacity sm:text-sm sm:whitespace-nowrap dark:text-sky-300",
          showPrompt,
        )}
        aria-hidden={!withPrompt}
      >
        {prompt}
      </span>
      <span className="min-w-0 break-words text-neutral-900 dark:text-neutral-100">{content}</span>
      <div className="flex items-center gap-2 justify-start sm:justify-end">
        {reportButton}
        {statusBadge ?? <span aria-hidden className="h-4 w-0" />}
      </div>
    </div>
  );
}
