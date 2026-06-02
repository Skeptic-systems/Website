"use client";

import { useTranslations } from "next-intl";
import { Check, Copy, Lightning } from "phosphor-react";
import { useCallback, useMemo, useState } from "react";

import { geist } from "@/app/fonts";
import {
  DOCKER_RUN_EXAMPLES,
  generateComposeYaml,
  parseDockerRun,
} from "@/lib/vault-tools/docker-compose";

type YamlToken = { text: string; className?: string };

function tokenizeLine(line: string): YamlToken[] {
  if (/^\s*#/.test(line)) {
    return [{ text: line, className: "text-neutral-500" }];
  }
  if (/^\s*-\s/.test(line)) {
    const match = line.match(/^(\s*-\s)(.*)$/);
    if (match) {
      return [{ text: match[1], className: "text-sky-400" }, { text: match[2] }];
    }
  }
  const kvMatch = line.match(/^(\s*)(\w[\w_-]*)(:)(.*)$/);
  if (kvMatch) {
    const [, space, key, colon, rest] = kvMatch;
    return [
      { text: space },
      { text: key, className: "text-emerald-400" },
      { text: colon, className: "text-neutral-400" },
      { text: rest },
    ];
  }
  return [{ text: line }];
}

function HighlightedYaml({ yaml }: { yaml: string }) {
  const lines = yaml.split("\n");
  return (
    <>
      {lines.map((line, lineIdx) => (
        <span key={`${lineIdx}-${line}`}>
          {tokenizeLine(line).map((token, tokenIdx) => (
            <span key={`${tokenIdx}-${token.text}`} className={token.className}>
              {token.text}
            </span>
          ))}
          {lineIdx < lines.length - 1 ? "\n" : null}
        </span>
      ))}
    </>
  );
}

export function DockerComposeConverter() {
  const t = useTranslations("dockerComposeConverter");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (!trimmed.startsWith("docker") || !trimmed.includes("run")) return null;
    const parsed = parseDockerRun(trimmed);
    if (!parsed.image) return null;
    const yaml = generateComposeYaml(parsed);
    return { yaml, warnings: parsed.warnings };
  }, [input]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.yaml).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  const handleExample = useCallback(() => {
    const idx = Math.floor(Math.random() * DOCKER_RUN_EXAMPLES.length);
    setInput(DOCKER_RUN_EXAMPLES[idx]);
    setCopied(false);
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
    setCopied(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3
            className={`${geist.className} text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400`}
          >
            {t("input.label")}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExample}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200/60 px-2.5 py-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700/60 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-100"
            >
              <Lightning className="h-3 w-3" weight="fill" />
              {t("input.example")}
            </button>
            {input && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-md border border-neutral-200/60 px-2.5 py-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700/60 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-100"
              >
                {t("input.clear")}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200/60 bg-neutral-950 dark:border-neutral-800/60">
          <div className="flex items-center gap-2 border-b border-neutral-800/60 px-4 py-2">
            <span className="font-mono text-[0.65rem] text-neutral-500">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setCopied(false);
              }}
              placeholder={t("input.placeholder")}
              className="w-full bg-transparent font-mono text-sm text-neutral-200 outline-none placeholder:text-neutral-600"
            />
          </div>
        </div>
        <p className="text-[0.65rem] text-neutral-400 dark:text-neutral-500">{t("input.hint")}</p>
      </div>

      {result && (
        <>
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

            <div className="overflow-x-auto rounded-xl border border-neutral-200/60 bg-neutral-950 dark:border-neutral-800/60">
              <div className="flex items-center gap-2 border-b border-neutral-800/60 px-4 py-2">
                <span className="font-mono text-[0.6rem] uppercase tracking-wider text-neutral-500">
                  docker-compose.yml
                </span>
              </div>
              <pre className="p-4 font-mono text-[0.8rem] leading-relaxed text-neutral-200">
                <code>
                  <HighlightedYaml yaml={result.yaml} />
                </code>
              </pre>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
              <h4
                className={`${geist.className} mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400`}
              >
                {t("warnings.label")}
              </h4>
              <ul className="space-y-1">
                {result.warnings.map((w) => (
                  <li
                    key={w}
                    className="text-xs leading-relaxed text-amber-800 dark:text-amber-300/80"
                  >
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
