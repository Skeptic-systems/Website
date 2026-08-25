"use client";

import { useTranslations } from "next-intl";
import { ArrowsClockwise, Check, Copy, DownloadSimple, Lightning } from "phosphor-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { geist } from "@/app/fonts";
import {
  AD_ROLE_DEFAULT_COUNT,
  AD_ROLES,
  type AdBlueprintOptions,
  type AdRoleKey,
  blueprintToCsv,
  blueprintToText,
  createSeed,
  DEFAULT_AD_OPTIONS,
  DEFAULT_HOSTNAME_OPTIONS,
  DOMAIN_TLDS,
  type DomainTld,
  generateAdBlueprint,
  generateHostnames,
  getThemeSize,
  type HostnameOptions,
  hostnamesToText,
  NAME_THEMES,
  type NameThemeKey,
  type NamingCase,
  type NamingStyle,
  type Separator,
} from "@/lib/vault-tools/name-generator";

const COUNT_OPTIONS = [8, 12, 24, 48, 100] as const;
const SEPARATORS: readonly Separator[] = ["-", "_", ""];
const CASINGS: readonly NamingCase[] = ["lower", "upper", "capital"];
const STYLES: readonly NamingStyle[] = ["pure", "roleTag", "indexed", "roleTagIndexed"];

const inputClass =
  "block w-full rounded-lg border border-neutral-200/60 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[hsl(var(--accent))] dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-100";
const labelClass = "text-xs font-medium text-neutral-600 dark:text-neutral-300";
const sectionTitleClass = (className = "") =>
  `${geist.className} text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400 ${className}`;

export function HostnameGenerator() {
  const t = useTranslations("hostnameGenerator");
  const [mode, setMode] = useState<"hosts" | "domain">("hosts");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = useCallback((value: string, token: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(token);
      setTimeout(() => setCopied((current) => (current === token ? null : current)), 1800);
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex gap-1 rounded-lg border border-neutral-200/60 bg-neutral-50/60 p-1 dark:border-neutral-800/60 dark:bg-neutral-900/40">
        {(["hosts", "domain"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              mode === value
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            {t(`modes.${value}`)}
          </button>
        ))}
      </div>

      {mode === "hosts" ? (
        <HostsMode t={t} copied={copied} onCopy={copy} />
      ) : (
        <DomainMode t={t} copied={copied} onCopy={copy} />
      )}
    </div>
  );
}

type SharedProps = {
  t: ReturnType<typeof useTranslations>;
  copied: string | null;
  onCopy: (value: string, token: string) => void;
};

function ThemePicker({
  t,
  selected,
  multi,
  onToggle,
}: {
  t: ReturnType<typeof useTranslations>;
  selected: readonly NameThemeKey[];
  multi: boolean;
  onToggle: (key: NameThemeKey) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className={sectionTitleClass()}>
          {multi ? t("themes.pickMany") : t("themes.pickOne")}
        </h3>
        <span className="text-[0.65rem] text-neutral-400 dark:text-neutral-500">
          {t("themes.hint")}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {NAME_THEMES.map((theme) => {
          const active = selected.includes(theme.key);
          return (
            <button
              key={theme.key}
              type="button"
              onClick={() => onToggle(theme.key)}
              className={`group rounded-xl border p-3 text-left transition ${
                active
                  ? "border-[hsl(var(--accent))]/40 bg-[hsl(var(--accent))]/10 shadow-sm"
                  : "border-neutral-200/60 bg-neutral-50/60 hover:border-neutral-300 dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {t(`themes.${theme.key}.label`)}
                </span>
                <span className="shrink-0 rounded-full bg-neutral-200/70 px-2 py-0.5 font-mono text-[0.6rem] text-neutral-600 dark:bg-neutral-700/60 dark:text-neutral-300">
                  {getThemeSize(theme.key)}
                </span>
              </div>
              <p className="mt-1 text-[0.7rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
                {t(`themes.${theme.key}.description`)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GenerateButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-neutral-800 active:scale-[0.99] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 sm:w-auto"
    >
      <Lightning className="h-4 w-4 transition group-hover:scale-110" weight="fill" />
      {label}
    </button>
  );
}

function CopyButton({
  label,
  copiedLabel,
  active,
  onClick,
  icon = "copy",
}: {
  label: string;
  copiedLabel: string;
  active: boolean;
  onClick: () => void;
  icon?: "copy" | "download";
}) {
  const Icon = icon === "download" ? DownloadSimple : Copy;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200/60 px-2.5 py-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700/60 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-100"
    >
      {active ? (
        <>
          <Check className="h-3 w-3" weight="bold" />
          {copiedLabel}
        </>
      ) : (
        <>
          <Icon className="h-3 w-3" />
          {label}
        </>
      )}
    </button>
  );
}

function HostsMode({ t, copied, onCopy }: SharedProps) {
  const [options, setOptions] = useState<HostnameOptions>(DEFAULT_HOSTNAME_OPTIONS);
  const [seed, setSeed] = useState<number | null>(null);

  // Seed only on the client so server and client markup stay identical.
  useEffect(() => setSeed(createSeed()), []);

  const names = useMemo(
    () => (seed === null ? [] : generateHostnames(options, seed)),
    [options, seed]
  );

  const toggleTheme = useCallback((key: NameThemeKey) => {
    setOptions((prev) => {
      const active = prev.themes.includes(key);
      const themes = active ? prev.themes.filter((item) => item !== key) : [...prev.themes, key];
      return { ...prev, themes: themes.length > 0 ? themes : prev.themes };
    });
  }, []);

  const update = useCallback(
    <K extends keyof HostnameOptions>(key: K, value: HostnameOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const oversized = names.filter((entry) => !entry.check.netbiosSafe).length;

  return (
    <div className="space-y-6">
      <ThemePicker t={t} selected={options.themes} multi onToggle={toggleTheme} />

      <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/60 p-5 dark:border-neutral-800/60 dark:bg-neutral-900/40">
        <h3 className={sectionTitleClass("mb-4")}>{t("options.title")}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1">
            <span className={labelClass}>{t("options.count")}</span>
            <select
              value={options.count}
              onChange={(event) => update("count", Number(event.target.value))}
              className={inputClass}
            >
              {COUNT_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className={labelClass}>{t("options.prefix")}</span>
            <input
              type="text"
              value={options.prefix}
              onChange={(event) => update("prefix", event.target.value)}
              placeholder={t("options.prefixPlaceholder")}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1">
            <span className={labelClass}>{t("options.separator")}</span>
            <select
              value={options.separator}
              onChange={(event) => update("separator", event.target.value as Separator)}
              className={inputClass}
            >
              {SEPARATORS.map((value) => (
                <option key={value || "none"} value={value}>
                  {t(
                    `options.separators.${value === "-" ? "dash" : value === "_" ? "underscore" : "none"}`
                  )}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className={labelClass}>{t("options.casing")}</span>
            <select
              value={options.casing}
              onChange={(event) => update("casing", event.target.value as NamingCase)}
              className={inputClass}
            >
              {CASINGS.map((value) => (
                <option key={value} value={value}>
                  {t(`options.casings.${value}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={options.numbered}
            onChange={(event) => update("numbered", event.target.checked)}
            className="h-3.5 w-3.5 accent-[hsl(var(--accent))]"
          />
          {t("options.numbered")}
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <GenerateButton label={t("actions.generate")} onClick={() => setSeed(createSeed())} />
        <div className="flex items-center gap-2">
          {oversized > 0 && (
            <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[0.65rem] font-medium text-amber-700 dark:text-amber-300">
              {t("warnings.netbios", { count: oversized })}
            </span>
          )}
          <CopyButton
            label={t("actions.copyAll")}
            copiedLabel={t("actions.copied")}
            active={copied === "hosts-all"}
            onClick={() => onCopy(hostnamesToText(names), "hosts-all")}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {names.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => onCopy(entry.hostname, entry.id)}
            className="group flex items-center justify-between gap-3 rounded-xl border border-neutral-200/60 bg-white/70 px-3 py-2.5 text-left transition hover:border-neutral-300 dark:border-neutral-800/60 dark:bg-neutral-950/40 dark:hover:border-neutral-700"
          >
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-neutral-800 dark:text-neutral-100">
              {entry.hostname}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {!entry.check.netbiosSafe && (
                <span className="font-mono text-[0.6rem] text-amber-600 dark:text-amber-400">
                  {entry.check.length}
                </span>
              )}
              {copied === entry.id ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" weight="bold" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-neutral-400 opacity-0 transition group-hover:opacity-100" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DomainMode({ t, copied, onCopy }: SharedProps) {
  const [options, setOptions] = useState<AdBlueprintOptions>(DEFAULT_AD_OPTIONS);
  const [seed, setSeed] = useState<number | null>(null);

  useEffect(() => setSeed(createSeed()), []);

  const blueprint = useMemo(
    () => (seed === null ? null : generateAdBlueprint(options, seed)),
    [options, seed]
  );

  const update = useCallback(
    <K extends keyof AdBlueprintOptions>(key: K, value: AdBlueprintOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleRole = useCallback((role: AdRoleKey) => {
    setOptions((prev) => {
      const active = prev.roles.includes(role);
      const roles = active
        ? prev.roles.filter((item) => item !== role)
        : AD_ROLES.filter((item) => item === role || prev.roles.includes(item));
      return { ...prev, roles };
    });
  }, []);

  const setRoleCount = useCallback((role: AdRoleKey, value: number) => {
    setOptions((prev) => ({
      ...prev,
      counts: { ...prev.counts, [role]: Math.max(1, Math.min(value, 50)) },
    }));
  }, []);

  return (
    <div className="space-y-6">
      <ThemePicker
        t={t}
        selected={[options.themeKey]}
        multi={false}
        onToggle={(key) => update("themeKey", key)}
      />

      <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/60 p-5 dark:border-neutral-800/60 dark:bg-neutral-900/40">
        <h3 className={sectionTitleClass("mb-4")}>{t("domain.title")}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1">
            <span className={labelClass}>{t("domain.label")}</span>
            <input
              type="text"
              value={options.domainLabel}
              onChange={(event) => update("domainLabel", event.target.value)}
              placeholder={blueprint?.domainLabel ?? t("domain.labelPlaceholder")}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1">
            <span className={labelClass}>{t("domain.tld")}</span>
            <select
              value={options.tld}
              onChange={(event) => update("tld", event.target.value as DomainTld)}
              className={inputClass}
            >
              {DOMAIN_TLDS.map((value) => (
                <option key={value} value={value}>
                  .{value}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className={labelClass}>{t("options.prefix")}</span>
            <input
              type="text"
              value={options.prefix}
              onChange={(event) => update("prefix", event.target.value)}
              placeholder={t("options.prefixPlaceholder")}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1">
            <span className={labelClass}>{t("domain.style")}</span>
            <select
              value={options.style}
              onChange={(event) => update("style", event.target.value as NamingStyle)}
              className={inputClass}
            >
              {STYLES.map((value) => (
                <option key={value} value={value}>
                  {t(`domain.styles.${value}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className={labelClass}>{t("options.separator")}</span>
            <select
              value={options.separator}
              onChange={(event) => update("separator", event.target.value as Separator)}
              className={inputClass}
            >
              {SEPARATORS.map((value) => (
                <option key={value || "none"} value={value}>
                  {t(
                    `options.separators.${value === "-" ? "dash" : value === "_" ? "underscore" : "none"}`
                  )}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className={labelClass}>{t("options.casing")}</span>
            <select
              value={options.casing}
              onChange={(event) => update("casing", event.target.value as NamingCase)}
              className={inputClass}
            >
              {CASINGS.map((value) => (
                <option key={value} value={value}>
                  {t(`options.casings.${value}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/60 p-5 dark:border-neutral-800/60 dark:bg-neutral-900/40">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h3 className={sectionTitleClass()}>{t("roles.title")}</h3>
          <span className="text-[0.65rem] text-neutral-400 dark:text-neutral-500">
            {t("roles.hint")}
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AD_ROLES.map((role) => {
            const active = options.roles.includes(role);
            const count = options.counts[role] ?? AD_ROLE_DEFAULT_COUNT[role];
            return (
              <div
                key={role}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                  active
                    ? "border-[hsl(var(--accent))]/40 bg-[hsl(var(--accent))]/5"
                    : "border-neutral-200/60 bg-white/50 dark:border-neutral-800/60 dark:bg-neutral-950/30"
                }`}
              >
                <label className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleRole(role)}
                    className="h-3.5 w-3.5 shrink-0 accent-[hsl(var(--accent))]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                      {t(`roles.${role}.label`)}
                    </span>
                    <span className="block truncate text-[0.65rem] text-neutral-500 dark:text-neutral-400">
                      {t(`roles.${role}.hint`)}
                    </span>
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  disabled={!active}
                  onChange={(event) => setRoleCount(role, Number(event.target.value))}
                  className="w-14 shrink-0 rounded-md border border-neutral-200/60 bg-white px-2 py-1 text-center font-mono text-xs text-neutral-800 outline-none transition focus:border-[hsl(var(--accent))] disabled:opacity-40 dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <GenerateButton label={t("actions.generateDomain")} onClick={() => setSeed(createSeed())} />
        {blueprint && (
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton
              label={t("actions.copyPlan")}
              copiedLabel={t("actions.copied")}
              active={copied === "plan-text"}
              onClick={() => onCopy(blueprintToText(blueprint), "plan-text")}
            />
            <CopyButton
              label={t("actions.copyCsv")}
              copiedLabel={t("actions.copied")}
              active={copied === "plan-csv"}
              icon="download"
              onClick={() => onCopy(blueprintToCsv(blueprint), "plan-csv")}
            />
          </div>
        )}
      </div>

      {blueprint && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-neutral-950 p-5 dark:border-neutral-800/60">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p
                  className={`${geist.className} text-[0.6rem] uppercase tracking-[0.3em] text-neutral-500`}
                >
                  {t("domain.forest")}
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-[hsl(var(--accent))]">
                  {blueprint.domain}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`${geist.className} text-[0.6rem] uppercase tracking-[0.3em] text-neutral-500`}
                >
                  {t("domain.netbios")}
                </p>
                <p className="mt-1 font-mono text-lg text-neutral-200">{blueprint.netbios}</p>
              </div>
              <button
                type="button"
                onClick={() => onCopy(blueprint.domain, "domain")}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700/60 px-2.5 py-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-neutral-400 transition hover:text-neutral-100"
              >
                {copied === "domain" ? (
                  <Check className="h-3 w-3" weight="bold" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {t("actions.copyDomain")}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
            <table className="w-full min-w-[36rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200/60 bg-neutral-50/80 dark:border-neutral-800/60 dark:bg-neutral-900/60">
                  <th className="px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    {t("table.role")}
                  </th>
                  <th className="px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    {t("table.hostname")}
                  </th>
                  <th className="px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    {t("table.fqdn")}
                  </th>
                  <th className="w-10 px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {blueprint.entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="group border-b border-neutral-200/40 last:border-0 transition hover:bg-neutral-50/80 dark:border-neutral-800/40 dark:hover:bg-neutral-900/40"
                  >
                    <td className="px-4 py-2">
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {t(`roles.${entry.roleKey}.label`)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {entry.hostname}
                      </span>
                      {!entry.check.netbiosSafe && (
                        <span className="ml-2 font-mono text-[0.6rem] text-amber-600 dark:text-amber-400">
                          {entry.check.length}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {entry.fqdn}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onCopy(entry.fqdn, entry.id)}
                        aria-label={t("actions.copy")}
                        className="text-neutral-400 transition hover:text-neutral-700 dark:hover:text-neutral-200"
                      >
                        {copied === entry.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" weight="bold" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-neutral-200/60 bg-neutral-50/60 p-4 text-[0.7rem] leading-relaxed text-neutral-500 dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:text-neutral-400">
            <ArrowsClockwise className="mt-0.5 h-3.5 w-3.5 shrink-0" weight="bold" />
            <p>{t("domain.note")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
