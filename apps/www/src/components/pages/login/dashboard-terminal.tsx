"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DashboardFeedback } from "./dashboard-feedback";
import type {
  FeedbackState,
  ReportReason,
  TerminalFormState,
  TerminalMessage,
} from "@/components/login/dashboard-types";

type TerminalMessagesState = {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  items: TerminalMessage[];
  refetch: () => Promise<unknown>;
};

type DashboardTerminalSectionProps = {
  canAdministrate: boolean;
  editingMessage: TerminalMessage | null;
  terminalForm: TerminalFormState;
  onTerminalFormChange: (field: keyof TerminalFormState, value: string) => void;
  onTerminalSubmit: () => void;
  onCancelEdit: () => void;
  onEditStart: (message: TerminalMessage) => void;
  terminalFeedback: FeedbackState;
  messagesState: TerminalMessagesState;
  pendingDeleteId: string | null;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  updatePending: boolean;
  deletePending: boolean;
  reportReasonLabels: Record<ReportReason, string>;
  formatTimestamp: (value: string) => string;
};

export function DashboardTerminalSection({
  canAdministrate,
  editingMessage,
  terminalForm,
  onTerminalFormChange,
  onTerminalSubmit,
  onCancelEdit,
  onEditStart,
  terminalFeedback,
  messagesState,
  pendingDeleteId,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  updatePending,
  deletePending,
  reportReasonLabels,
  formatTimestamp,
}: DashboardTerminalSectionProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  const renderTerminalList = () => {
    if (messagesState.isLoading) {
      return <p className="text-sm text-neutral-500">{tCommon("loading")}</p>;
    }

    if (messagesState.isError) {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-red-500">{t("terminal.error")}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => messagesState.refetch()}
            disabled={messagesState.isFetching}
          >
            {messagesState.isFetching ? t("terminal.actions.refreshing") : t("terminal.actions.refresh")}
          </Button>
        </div>
      );
    }

    if (messagesState.items.length === 0) {
      return <p className="text-sm text-neutral-500">{t("terminal.empty")}</p>;
    }

    return (
      <div className="space-y-4">
        {messagesState.items.map((message) => {
          const hasReports = message.reportCount > 0;
          const isPendingDelete = pendingDeleteId === message.id;

          return (
            <div
              key={message.id}
              className={cn(
                "relative rounded-2xl border p-4 transition",
                hasReports
                  ? "border-rose-200/80 bg-rose-50/70 dark:border-rose-500/30 dark:bg-rose-500/5"
                  : "border-neutral-200/70 dark:border-neutral-800/70",
                isPendingDelete ? "ring-1 ring-amber-300 dark:ring-amber-400" : "",
              )}
            >
              {isPendingDelete ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-neutral-950/70 px-4 text-center backdrop-blur-sm dark:bg-neutral-950/80">
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("terminal.actions.confirmDelete")}
                    className="w-full max-w-xs rounded-2xl border border-amber-200/80 bg-white/95 p-4 shadow-2xl dark:border-amber-500/30 dark:bg-neutral-900"
                  >
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {t("terminal.actions.confirmDelete")}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => onDeleteConfirm(message.id)}
                        disabled={deletePending}
                      >
                        {t("terminal.actions.confirmYes")}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={onDeleteCancel}
                        disabled={deletePending}
                      >
                        {t("terminal.actions.confirmNo")}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
              <div
                aria-hidden={isPendingDelete}
                className={cn(isPendingDelete ? "pointer-events-none opacity-30 blur-[1px]" : "")}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
                    {formatTimestamp(message.createdAt)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {hasReports ? (
                      <span className="inline-flex items-center rounded-full bg-rose-500/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">
                        {t("terminal.reports.badge", { count: message.reportCount })}
                      </span>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onEditStart(message)}
                      disabled={updatePending}
                    >
                      {t("terminal.actions.edit")}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => onDeleteRequest(message.id)}
                      disabled={deletePending}
                    >
                      {t("terminal.actions.delete")}
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  {t("terminal.session", { id: message.sessionId })}
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">{t("terminal.fields.textDefault")}:</span> {message.textDefault}
                  </p>
                  <p>
                    <span className="font-semibold">{t("terminal.fields.textEn")}:</span> {message.textEn}
                  </p>
                  <p>
                    <span className="font-semibold">{t("terminal.fields.textDe")}:</span> {message.textDe}
                  </p>
                </div>
                {hasReports ? (
                  <div className="mt-4 space-y-3 rounded-2xl border border-rose-200/70 bg-white/80 p-4 dark:border-rose-500/20 dark:bg-neutral-950/40">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-600 dark:text-rose-300">
                      {t("terminal.reports.heading", { count: message.reportCount })}
                    </p>
                    <div className="space-y-3">
                      {message.reports.length === 0 ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("terminal.reports.empty")}</p>
                      ) : (
                        message.reports.map((report) => (
                          <div
                            key={report.id}
                            className="rounded-xl border border-rose-100/70 bg-rose-50/70 p-3 dark:border-rose-500/20 dark:bg-rose-500/10"
                          >
                            <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">
                              {reportReasonLabels[report.reason] ?? report.reason}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {formatTimestamp(report.createdAt)}
                            </p>
                            <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-100">{report.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="rounded-[32px] border border-neutral-200/70 bg-white/90 p-8 shadow-xl backdrop-blur-lg transition dark:border-neutral-800/70 dark:bg-neutral-900/80">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[hsl(var(--accent))] opacity-90">
            {t("terminal.accent")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{t("terminal.title")}</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{t("terminal.description")}</p>
        </div>
        {canAdministrate ? (
          <>
            <DashboardFeedback feedback={terminalFeedback} />
            <div className="mt-4 rounded-2xl border border-neutral-200/70 bg-white/60 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/50">
              {editingMessage ? (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    {t("terminal.editing", { id: editingMessage.id })}
                  </p>
                  {(["textDefault", "textEn", "textDe"] as const).map((field) => (
                    <label key={field} className="flex flex-col gap-2 text-left">
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
                        {t(`terminal.fields.${field}`)}
                      </span>
                      <textarea
                        rows={field === "textDefault" ? 3 : 2}
                        value={terminalForm[field]}
                        onChange={(event) => onTerminalFormChange(field, event.target.value)}
                        className="w-full rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30"
                      />
                    </label>
                  ))}
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={onTerminalSubmit} disabled={updatePending}>
                      {updatePending ? t("terminal.actions.saving") : t("terminal.actions.save")}
                    </Button>
                    <Button type="button" variant="secondary" onClick={onCancelEdit} disabled={updatePending}>
                      {t("terminal.actions.cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">{t("terminal.instructions")}</p>
              )}
            </div>
            <div className="mt-6">{renderTerminalList()}</div>
          </>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("access.forbidden")}</p>
        )}
      </div>
    </section>
  );
}

