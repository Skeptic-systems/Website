"use client";

import { useTranslations } from "next-intl";
import { Copy, Check, ArrowRight } from "phosphor-react";
import { useCallback, useMemo, useState } from "react";

import { geist } from "@/app/fonts";
import {
  type SourceType,
  type TargetType,
  type TargetCategory,
  type CertParams,
  DEFAULT_PARAMS,
  SOURCE_GROUPS,
  TARGET_META,
  getValidTargets,
  getOperationSpec,
  generateCommand,
} from "@/lib/vault-tools/cert-commands";

const CATEGORY_ORDER: readonly TargetCategory[] = [
  "convert",
  "bundle",
  "keys",
  "generate",
  "inspect",
];

export function CertConverter() {
  const t = useTranslations("certConverter");
  const [source, setSource] = useState<SourceType | null>(null);
  const [target, setTarget] = useState<TargetType | null>(null);
  const [params, setParams] = useState<CertParams>({ ...DEFAULT_PARAMS });
  const [copied, setCopied] = useState(false);
  const [showSubject, setShowSubject] = useState(false);

  const targets = useMemo(
    () => (source ? getValidTargets(source) : []),
    [source],
  );

  const groupedTargets = useMemo(() => {
    const groups: Record<string, TargetType[]> = {};
    for (const tgt of targets) {
      const cat = TARGET_META[tgt].category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(tgt);
    }
    return CATEGORY_ORDER
      .filter((cat) => (groups[cat]?.length ?? 0) > 0)
      .map((cat) => ({ category: cat, items: groups[cat] }));
  }, [targets]);

  const spec = useMemo(
    () => (source && target ? getOperationSpec(source, target) : null),
    [source, target],
  );

  const command = useMemo(
    () => (source && target ? generateCommand(source, target, params) : null),
    [source, target, params],
  );

  const handleSourceSelect = useCallback((s: SourceType) => {
    setSource(s);
    setTarget(null);
    setParams({ ...DEFAULT_PARAMS });
    setCopied(false);
    setShowSubject(false);
  }, []);

  const handleTargetSelect = useCallback((tgt: TargetType) => {
    setTarget(tgt);
    setParams({ ...DEFAULT_PARAMS });
    setCopied(false);
    setShowSubject(false);
  }, []);

  const updateParam = useCallback((key: keyof CertParams, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setCopied(false);
  }, []);

  const handleCopy = useCallback(() => {
    if (!command) return;
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [command]);

  const hasSubjectFields = spec?.params.some((p) => p.key === "cn") ?? false;

  const subjectKeys: Array<keyof CertParams> = [
    "cn", "org", "ou", "country", "state", "locality", "email",
  ];

  const coreParams = spec?.params.filter(
    (p) => !subjectKeys.includes(p.key),
  );

  return (
    <div className="space-y-6">
      {/* Source → Target selector */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
        {/* Left: I have */}
        <div className="space-y-3">
          <h3
            className={`${geist.className} text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400`}
          >
            {t("source.label")}
          </h3>
          <div className="space-y-3">
            {SOURCE_GROUPS.map((group) => (
              <div key={group.category}>
                <p className="mb-1 px-1 text-[0.6rem] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-600">
                  {t(`categories.source.${group.category}`)}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSourceSelect(s)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        source === s
                          ? "bg-[hsl(var(--accent))]/10 font-medium text-neutral-900 ring-1 ring-[hsl(var(--accent))]/30 dark:text-neutral-50"
                          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      <span className="block font-medium leading-snug">
                        {t(`source.${s}`)}
                      </span>
                      <span className="block text-[0.65rem] leading-snug text-neutral-500 dark:text-neutral-500">
                        {t(`source.${s}Hint`)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden items-center justify-center md:flex">
          <ArrowRight
            className="h-4 w-4 text-neutral-300 dark:text-neutral-700"
            weight="bold"
          />
        </div>

        {/* Right: I want */}
        <div className="space-y-3">
          <h3
            className={`${geist.className} text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400`}
          >
            {t("target.label")}
          </h3>
          {source && groupedTargets.length > 0 ? (
            <div className="space-y-3">
              {groupedTargets.map((group) => (
                <div key={group.category}>
                  <p className="mb-1 px-1 text-[0.6rem] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-600">
                    {t(`categories.target.${group.category}`)}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((tgt) => (
                      <button
                        key={tgt}
                        type="button"
                        onClick={() => handleTargetSelect(tgt)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                          target === tgt
                            ? "bg-[hsl(var(--accent))]/10 font-medium text-neutral-900 ring-1 ring-[hsl(var(--accent))]/30 dark:text-neutral-50"
                            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
                        }`}
                      >
                        <span className="block font-medium leading-snug">
                          {t(`target.${tgt}`)}
                        </span>
                        <span className="block text-[0.65rem] leading-snug text-neutral-500 dark:text-neutral-500">
                          {t(`target.${tgt}Hint`)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[120px] items-center justify-center rounded-xl border border-dashed border-neutral-200/60 dark:border-neutral-800/60">
              <p className="text-xs text-neutral-400 dark:text-neutral-600">
                {t("target.placeholder")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Parameters */}
      {spec && source && target && (
        <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/60 p-5 dark:border-neutral-800/60 dark:bg-neutral-900/40">
          <h3
            className={`${geist.className} mb-4 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400`}
          >
            {t("params.label")}
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            {coreParams?.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={params[field.key]}
                onChange={(v) => updateParam(field.key, v)}
                t={t}
              />
            ))}
          </div>

          {hasSubjectFields && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowSubject((p) => !p)}
                className="text-xs font-medium text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                {showSubject
                  ? t("params.hideSubject")
                  : t("params.showSubject")}
              </button>

              {showSubject && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {spec.params
                    .filter((p) => subjectKeys.includes(p.key))
                    .map((field) => (
                      <FieldInput
                        key={field.key}
                        field={field}
                        value={params[field.key]}
                        onChange={(v) => updateParam(field.key, v)}
                        t={t}
                      />
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Generated command */}
      {command && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3
              className={`${geist.className} text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400`}
            >
              {t("output.label")}
            </h3>
            <button
              type="button"
              onClick={handleCopy}
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
            <pre className="whitespace-pre-wrap text-[0.8rem] leading-relaxed text-neutral-200">
              <code>{command}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

type FieldInputProps = {
  field: {
    key: keyof CertParams;
    type: "text" | "password" | "select";
    required: boolean;
    options?: readonly string[];
  };
  value: string;
  onChange: (v: string) => void;
  t: ReturnType<typeof useTranslations>;
};

function FieldInput({ field, value, onChange, t }: FieldInputProps) {
  const label = t(`params.fields.${field.key}`);
  const placeholder = t(`params.placeholders.${field.key}`);

  if (field.type === "select" && field.options) {
    return (
      <label className="block space-y-1">
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
          {label}
          {field.required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-lg border border-neutral-200/60 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[hsl(var(--accent))] dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-100"
        >
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
        {label}
        {field.required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <input
        type={field.type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-lg border border-neutral-200/60 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[hsl(var(--accent))] dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600"
      />
    </label>
  );
}
