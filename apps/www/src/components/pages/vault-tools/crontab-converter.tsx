"use client";

import { useTranslations } from "next-intl";
import { ArrowsClockwise, Check, Copy } from "phosphor-react";
import { useCallback, useMemo, useState } from "react";

import { geist } from "@/app/fonts";
import {
  buildExpression,
  CHEATSHEET_EXAMPLES,
  type CronBuilderState,
  type CronPreset,
  DEFAULT_BUILDER_STATE,
  describeCron,
  FIELD_ORDER,
  FIELD_RANGES,
  SPECIAL_TOKENS,
  validateCron,
  WEEKDAYS,
} from "@/lib/vault-tools/crontab";

const PRESETS: readonly CronPreset[] = [
  "everyMinute",
  "everyNMinutes",
  "everyHour",
  "everyNHours",
  "dailyAt",
  "weeklyOn",
  "monthlyOn",
  "custom",
];

export function CrontabConverter() {
  const t = useTranslations("crontabConverter");
  const [mode, setMode] = useState<"build" | "read">("build");
  const [state, setState] = useState<CronBuilderState>({ ...DEFAULT_BUILDER_STATE });
  const [readInput, setReadInput] = useState("");
  const [copied, setCopied] = useState(false);

  const expression = useMemo(() => buildExpression(state), [state]);
  const description = useMemo(() => describeCron(expression), [expression]);

  const readResult = useMemo(() => {
    if (!readInput.trim()) return null;
    const validation = validateCron(readInput.trim());
    const desc = describeCron(readInput.trim());
    return { desc, validation };
  }, [readInput]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const updateState = useCallback((key: keyof CronBuilderState, value: string) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setCopied(false);
  }, []);

  return (
    <div className="space-y-8">
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-lg border border-neutral-200/60 bg-neutral-50/60 p-1 dark:border-neutral-800/60 dark:bg-neutral-900/40">
        <button
          type="button"
          onClick={() => setMode("build")}
          className={`flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
            mode === "build"
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
              : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          }`}
        >
          {t("modes.build")}
        </button>
        <button
          type="button"
          onClick={() => setMode("read")}
          className={`flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
            mode === "read"
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
              : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          }`}
        >
          {t("modes.read")}
        </button>
      </div>

      {mode === "build" ? (
        <BuildMode
          t={t}
          state={state}
          expression={expression}
          description={description}
          copied={copied}
          onUpdate={updateState}
          onCopy={handleCopy}
        />
      ) : (
        <ReadMode
          t={t}
          input={readInput}
          result={readResult}
          copied={copied}
          onInputChange={setReadInput}
          onCopy={handleCopy}
        />
      )}

      {/* Cheatsheet */}
      <div className="space-y-4">
        <h3
          className={`${geist.className} text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400`}
        >
          {t("cheatsheet.title")}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Field reference */}
          <div className="rounded-xl border border-neutral-200/60 bg-neutral-50/60 p-4 dark:border-neutral-800/60 dark:bg-neutral-900/40">
            <h4 className="mb-3 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {t("cheatsheet.fieldOrder")}
            </h4>
            <div className="flex gap-2 font-mono text-xs">
              {FIELD_ORDER.map((field) => (
                <div key={field} className="flex flex-col items-center gap-1">
                  <span className="rounded bg-neutral-200/80 px-2 py-0.5 text-neutral-700 dark:bg-neutral-700/60 dark:text-neutral-300">
                    {t(`cheatsheet.fields.${field}`)}
                  </span>
                  <span className="text-[0.6rem] text-neutral-400">
                    {FIELD_RANGES[field].min}-{FIELD_RANGES[field].max}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Special tokens */}
          <div className="rounded-xl border border-neutral-200/60 bg-neutral-50/60 p-4 dark:border-neutral-800/60 dark:bg-neutral-900/40">
            <h4 className="mb-3 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {t("cheatsheet.tokens")}
            </h4>
            <div className="space-y-1.5">
              {SPECIAL_TOKENS.map((tok) => (
                <div key={tok.token} className="flex items-center gap-3 text-xs">
                  <code className="w-6 text-center font-mono font-bold text-violet-500 dark:text-violet-400">
                    {tok.token}
                  </code>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {t(`cheatsheet.tokenMeaning.${tok.meaningKey}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="rounded-xl border border-neutral-200/60 bg-neutral-50/60 p-4 dark:border-neutral-800/60 dark:bg-neutral-900/40">
          <h4 className="mb-3 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t("cheatsheet.examples")}
          </h4>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {CHEATSHEET_EXAMPLES.map((ex) => (
              <div key={ex.expression} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                <code className="shrink-0 font-mono text-xs font-medium text-neutral-800 dark:text-neutral-200">
                  {ex.expression}
                </code>
                <span className="text-[0.7rem] text-neutral-500 dark:text-neutral-400">
                  {t(`cheatsheet.desc.${ex.descriptionKey}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type BuildModeProps = {
  t: ReturnType<typeof useTranslations>;
  state: CronBuilderState;
  expression: string;
  description: string;
  copied: boolean;
  onUpdate: (key: keyof CronBuilderState, value: string) => void;
  onCopy: (text: string) => void;
};

function BuildMode({
  t,
  state,
  expression,
  description,
  copied,
  onUpdate,
  onCopy,
}: BuildModeProps) {
  return (
    <div className="space-y-5">
      {/* Preset selector */}
      <div className="space-y-3">
        <h3
          className={`${geist.className} text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400`}
        >
          {t("build.presetLabel")}
        </h3>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onUpdate("preset", preset)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                state.preset === preset
                  ? "bg-[hsl(var(--accent))]/10 text-neutral-900 ring-1 ring-[hsl(var(--accent))]/30 dark:text-neutral-50"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
              }`}
            >
              {t(`build.presets.${preset}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic inputs */}
      <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/60 p-5 dark:border-neutral-800/60 dark:bg-neutral-900/40">
        <h3
          className={`${geist.className} mb-4 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400`}
        >
          {t("build.paramsLabel")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {state.preset === "everyNMinutes" && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                {t("build.fields.intervalMinutes")}
              </span>
              <input
                type="number"
                min="1"
                max="59"
                value={state.intervalMinutes}
                onChange={(e) => onUpdate("intervalMinutes", e.target.value)}
                className="block w-full rounded-lg border border-neutral-200/60 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[hsl(var(--accent))] dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </label>
          )}
          {state.preset === "everyNHours" && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                {t("build.fields.intervalHours")}
              </span>
              <input
                type="number"
                min="1"
                max="23"
                value={state.intervalHours}
                onChange={(e) => onUpdate("intervalHours", e.target.value)}
                className="block w-full rounded-lg border border-neutral-200/60 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[hsl(var(--accent))] dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </label>
          )}
          {(state.preset === "everyHour" ||
            state.preset === "everyNHours" ||
            state.preset === "dailyAt" ||
            state.preset === "weeklyOn" ||
            state.preset === "monthlyOn") && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                {t("build.fields.minute")}
              </span>
              <input
                type="number"
                min="0"
                max="59"
                value={state.minute}
                onChange={(e) => onUpdate("minute", e.target.value)}
                className="block w-full rounded-lg border border-neutral-200/60 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[hsl(var(--accent))] dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </label>
          )}
          {(state.preset === "dailyAt" ||
            state.preset === "weeklyOn" ||
            state.preset === "monthlyOn") && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                {t("build.fields.hour")}
              </span>
              <input
                type="number"
                min="0"
                max="23"
                value={state.hour}
                onChange={(e) => onUpdate("hour", e.target.value)}
                className="block w-full rounded-lg border border-neutral-200/60 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[hsl(var(--accent))] dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </label>
          )}
          {state.preset === "weeklyOn" && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                {t("build.fields.dayOfWeek")}
              </span>
              <select
                value={state.dayOfWeek}
                onChange={(e) => onUpdate("dayOfWeek", e.target.value)}
                className="block w-full rounded-lg border border-neutral-200/60 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[hsl(var(--accent))] dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-100"
              >
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {t(`weekdays.${day.labelKey}`)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {state.preset === "monthlyOn" && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                {t("build.fields.dayOfMonth")}
              </span>
              <input
                type="number"
                min="1"
                max="31"
                value={state.dayOfMonth}
                onChange={(e) => onUpdate("dayOfMonth", e.target.value)}
                className="block w-full rounded-lg border border-neutral-200/60 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[hsl(var(--accent))] dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </label>
          )}
          {state.preset === "custom" &&
            FIELD_ORDER.map((field) => (
              <label key={field} className="block space-y-1">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  {t(`cheatsheet.fields.${field}`)}
                </span>
                <input
                  type="text"
                  value={state[field]}
                  onChange={(e) => onUpdate(field, e.target.value)}
                  placeholder="*"
                  className="block w-full rounded-lg border border-neutral-200/60 bg-white px-3 py-2 font-mono text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[hsl(var(--accent))] dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </label>
            ))}
        </div>
      </div>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3
            className={`${geist.className} text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400`}
          >
            {t("output.label")}
          </h3>
          <button
            type="button"
            onClick={() => onCopy(expression)}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200/60 px-2.5 py-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700/60 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-100"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" weight="bold" />
                {t("output.copied")}
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                {t("output.copy")}
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200/60 bg-neutral-950 p-4 dark:border-neutral-800/60">
          <pre className="font-mono text-lg font-bold text-violet-300">
            <code>{expression}</code>
          </pre>
          <p className="mt-2 text-sm text-neutral-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

type ReadModeProps = {
  t: ReturnType<typeof useTranslations>;
  input: string;
  result: { desc: string; validation: { valid: boolean; errors: string[] } } | null;
  copied: boolean;
  onInputChange: (value: string) => void;
  onCopy: (text: string) => void;
};

function ReadMode({ t, input, result, copied, onInputChange, onCopy }: ReadModeProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3
          className={`${geist.className} text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400`}
        >
          {t("read.label")}
        </h3>
        <div className="overflow-hidden rounded-xl border border-neutral-200/60 bg-neutral-950 dark:border-neutral-800/60">
          <div className="flex items-center gap-2 border-b border-neutral-800/60 px-4 py-2">
            <ArrowsClockwise className="h-3.5 w-3.5 text-neutral-500" weight="bold" />
            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={t("read.placeholder")}
              className="w-full bg-transparent font-mono text-sm text-neutral-200 outline-none placeholder:text-neutral-600"
            />
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-neutral-200/60 bg-neutral-950 p-4 dark:border-neutral-800/60">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-200">{result.desc}</p>
              <button
                type="button"
                onClick={() => onCopy(input.trim())}
                className="inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase tracking-wider text-neutral-500 transition hover:text-neutral-200"
              >
                {copied ? (
                  <Check className="h-3 w-3" weight="bold" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          {!result.validation.valid && (
            <div className="rounded-xl border border-red-200/60 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/30">
              <h4
                className={`${geist.className} mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-red-700 dark:text-red-400`}
              >
                {t("read.errors")}
              </h4>
              <ul className="space-y-1">
                {result.validation.errors.map((err) => (
                  <li
                    key={err}
                    className="text-xs leading-relaxed text-red-800 dark:text-red-300/80"
                  >
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
