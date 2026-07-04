"use client";

import { useTranslations } from "next-intl";
import { Check, Copy, TerminalWindow } from "phosphor-react";
import { useCallback, useMemo, useState } from "react";

import { geist } from "@/app/fonts";
import {
  QUICK_COMMANDS,
  type QuickCommand,
  type QuickCommandSnippet,
} from "@/lib/vault-tools/quick-commands";

type ShellToken = {
  id: string;
  text: string;
  className?: string;
};

const SHELL_COMMANDS = new Set([
  "apt",
  "apt-get",
  "curl",
  "sudo",
  "sh",
  "rm",
  "docker",
  "bash",
  "command",
  "find",
  "ffmpeg",
  "fi",
  "printf",
  "sed",
  "systemctl",
  "then",
  "touch",
]);

const POWERSHELL_COMMANDS = new Set([
  "Add-Content",
  "foreach",
  "Get-Command",
  "Get-Content",
  "if",
  "Join-Path",
  "New-Item",
  "Out-Null",
  "powershell",
  "Remove-Item",
  "Set-Content",
  "Split-Path",
  "Test-Path",
  "throw",
  "Where-Object",
]);

const POWERSHELL_KEYWORDS = new Set(["foreach", "function", "if", "in", "throw"]);

function tokenizeShell(command: string): ShellToken[] {
  let offset = 0;

  return command
    .split(/(\s+|&&|\|\||;|\|)/g)
    .filter(Boolean)
    .map((token, index, tokens) => {
      const id = `${offset}-${token}`;
      offset += token.length;

      if (/^\s+$/.test(token)) return { id, text: token };
      if (token === "&&" || token === "||" || token === ";" || token === "|") {
        return { id, text: token, className: "text-orange-300" };
      }
      if (token.startsWith("-")) return { id, text: token, className: "text-sky-300" };
      if (/^https?:\/\//.test(token)) return { id, text: token, className: "text-emerald-300" };
      if (/^-?\d+$/.test(token)) return { id, text: token, className: "text-violet-300" };

      const previous = tokens[index - 2];
      const startsPipeline =
        index === 0 ||
        previous === "&&" ||
        previous === "||" ||
        previous === ";" ||
        previous === "|";
      if (startsPipeline || SHELL_COMMANDS.has(token)) {
        return { id, text: token, className: "text-amber-300" };
      }

      if (token.includes(".")) return { id, text: token, className: "text-neutral-100" };
      return { id, text: token };
    });
}

function tokenizePowerShell(command: string): ShellToken[] {
  const tokenPattern =
    /'(?:''|[^'])*'|"(?:`.|[^"])*"|https?:\/\/\S+|\$[\w:]+|@\w+|\[[^\]]+\]|-\w+|[{}()[\].,;|&=]|\s+|[^\s{}()[\].,;|&=]+/g;
  const tokens = command.match(tokenPattern) ?? [];
  let offset = 0;

  return tokens.map((token) => {
    const id = `${offset}-${token}`;
    offset += token.length;

    if (/^\s+$/.test(token)) return { id, text: token };
    if (token === ";" || token === "|" || token === "&" || token === "=") {
      return { id, text: token, className: "text-orange-300" };
    }
    if (/^[{}()[\].,]$/.test(token)) return { id, text: token, className: "text-neutral-500" };
    if (token.startsWith("'") || token.startsWith('"')) {
      return { id, text: token, className: "text-emerald-300" };
    }
    if (token.startsWith("$") || token.startsWith("@")) {
      return { id, text: token, className: "text-violet-300" };
    }
    if (token.startsWith("-")) return { id, text: token, className: "text-sky-300" };
    if (/^https?:\/\//.test(token)) return { id, text: token, className: "text-emerald-300" };
    if (/^\[[^\]]+\]$/.test(token)) return { id, text: token, className: "text-cyan-300" };
    if (POWERSHELL_KEYWORDS.has(token)) return { id, text: token, className: "text-fuchsia-300" };
    if (POWERSHELL_COMMANDS.has(token) || /^[A-Z][a-z]+-[A-Z][A-Za-z]+$/.test(token)) {
      return { id, text: token, className: "text-amber-300" };
    }
    if (/^-?\d+$/.test(token)) return { id, text: token, className: "text-violet-300" };

    return { id, text: token };
  });
}

function getCommandSnippets(command: QuickCommand): readonly QuickCommandSnippet[] {
  if (command.snippets?.length) return command.snippets;
  if (!command.command) return [];

  return [
    {
      id: command.id,
      language: command.language,
      command: command.command,
    },
  ];
}

function HighlightedCommand({ snippet }: { snippet: QuickCommandSnippet }) {
  const tokens =
    snippet.language === "powershell"
      ? tokenizePowerShell(snippet.command)
      : tokenizeShell(snippet.command);

  return (
    <>
      {tokens.map((token) => (
        <span key={token.id} className={token.className}>
          {token.text}
        </span>
      ))}
    </>
  );
}

export function QuickCommands() {
  const t = useTranslations("quickCommands");
  const [activeId, setActiveId] = useState(QUICK_COMMANDS[0]?.id ?? "");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeCommand = useMemo(
    () => QUICK_COMMANDS.find((command) => command.id === activeId) ?? QUICK_COMMANDS[0],
    [activeId]
  );
  const activeSnippets = useMemo(
    () => (activeCommand ? getCommandSnippets(activeCommand) : []),
    [activeCommand]
  );

  const handleCopy = useCallback((snippet: QuickCommandSnippet) => {
    navigator.clipboard.writeText(snippet.command).then(() => {
      setCopiedId(snippet.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  if (!activeCommand) return null;

  return (
    <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3
            className={`${geist.className} text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400`}
          >
            {t("library")}
          </h3>
          <span className="rounded-full border border-neutral-200/60 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-neutral-400 dark:border-neutral-700/60 dark:text-neutral-500">
            {t("count", { count: QUICK_COMMANDS.length })}
          </span>
        </div>

        <div className="space-y-2">
          {QUICK_COMMANDS.map((command) => {
            const isActive = command.id === activeCommand.id;

            return (
              <button
                key={command.id}
                type="button"
                onClick={() => setActiveId(command.id)}
                className={`group w-full rounded-xl border p-4 text-left transition ${
                  isActive
                    ? "border-orange-300/70 bg-orange-50/70 shadow-sm dark:border-orange-400/30 dark:bg-orange-950/20"
                    : "border-neutral-200/60 bg-neutral-50/60 hover:border-neutral-300 hover:bg-white dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${
                      isActive
                        ? "bg-orange-500/10 text-orange-500 ring-orange-500/20 dark:text-orange-300"
                        : "bg-neutral-900/90 text-orange-300 ring-white/10 dark:bg-white/10"
                    }`}
                  >
                    <TerminalWindow className="h-4 w-4" weight="bold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-orange-500 dark:text-orange-300">
                      {command.categoryKey ? t(command.categoryKey) : t(command.badgeKey)}
                    </span>
                    <h4
                      className={`${geist.className} mt-1 text-sm font-bold text-neutral-900 dark:text-neutral-50`}
                    >
                      {t(command.titleKey)}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {t(command.descriptionKey)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="overflow-hidden rounded-xl border border-neutral-200/60 bg-neutral-950 shadow-xl dark:border-neutral-800/60">
          <div className="flex flex-col gap-3 border-b border-neutral-800/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex shrink-0 items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <h3
                className={`${geist.className} truncate text-xs font-semibold uppercase tracking-[0.22em] text-neutral-300`}
              >
                {t(activeCommand.titleKey)}
              </h3>
            </div>

            <span className="rounded-md border border-white/10 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-sky-200">
              {t("snippetCount", { count: activeSnippets.length })}
            </span>
          </div>

          <div className="space-y-3 p-4">
            {activeSnippets.map((snippet) => {
              const copied = copiedId === snippet.id;

              return (
                <div
                  key={snippet.id}
                  className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900/50"
                >
                  <div className="flex flex-col gap-2 border-b border-white/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="rounded border border-sky-300/20 bg-sky-300/10 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wider text-sky-200">
                        {t(`languages.${snippet.language}`)}
                      </span>
                      {snippet.titleKey ? (
                        <span
                          className={`${geist.className} truncate text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-neutral-400`}
                        >
                          {t(snippet.titleKey)}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(snippet)}
                      className="inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-md border border-white/10 px-2.5 text-[0.58rem] font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-white/20 hover:text-white"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3" weight="bold" />
                          {t("copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          {t("copy")}
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap p-4 font-mono text-[0.8rem] leading-relaxed text-neutral-300">
                    <code>
                      <span className="select-none text-emerald-300">$ </span>
                      <HighlightedCommand snippet={snippet} />
                    </code>
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
