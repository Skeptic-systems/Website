"use client";

import { Check, Copy, DownloadSimple } from "phosphor-react";
import { useCallback, useState } from "react";

import { geist } from "@/app/fonts";

type ScriptLanguage = "shell" | "powershell";

type ShellToken = {
  id: string;
  text: string;
  className?: string;
};

type ScriptTerminalProps = {
  content: string;
  copiedLabel: string;
  copyLabel: string;
  downloadHref: string;
  downloadLabel: string;
  downloadText: string;
  language: ScriptLanguage;
  title: string;
};

const POWERSHELL_COMMANDS = new Set([
  "Add-Content",
  "Copy-Item",
  "Ensure-Directory",
  "foreach",
  "ForEach-Object",
  "Get-ChildItem",
  "Get-Command",
  "Get-Content",
  "Get-Date",
  "Get-Item",
  "if",
  "Invoke-Item",
  "Join-Path",
  "Move-Item",
  "New-Item",
  "Out-Null",
  "Read-Host",
  "Remove-Item",
  "Set-Content",
  "Sort-Object",
  "Split-Path",
  "Start-Process",
  "Test-Path",
  "throw",
  "Write-Host",
  "Write-Info",
  "Write-Ok",
  "Write-Warn",
]);

const POWERSHELL_KEYWORDS = new Set([
  "catch",
  "else",
  "foreach",
  "function",
  "if",
  "in",
  "param",
  "return",
  "try",
  "throw",
]);

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

function tokenizeShell(command: string): ShellToken[] {
  let offset = 0;

  return command
    .split(/(\s+|&&|\|\||;|\|)/g)
    .filter(Boolean)
    .map((token) => {
      const id = `${offset}-${token}`;
      offset += token.length;

      if (/^\s+$/.test(token)) return { id, text: token };
      if (token === "&&" || token === "||" || token === ";" || token === "|") {
        return { id, text: token, className: "text-orange-300" };
      }
      if (token.startsWith("-")) return { id, text: token, className: "text-sky-300" };
      if (/^https?:\/\//.test(token)) return { id, text: token, className: "text-emerald-300" };
      if (/^-?\d+$/.test(token)) return { id, text: token, className: "text-violet-300" };

      return { id, text: token, className: "text-amber-300" };
    });
}

export function ScriptTerminal({
  content,
  copiedLabel,
  copyLabel,
  downloadHref,
  downloadLabel,
  downloadText,
  language,
  title,
}: ScriptTerminalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }, [content]);

  const tokens =
    language === "powershell" ? tokenizePowerShell(content) : tokenizeShell(content);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-neutral-950 shadow-2xl dark:border-neutral-800/60">
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <h3 className={`${geist.className} truncate text-xs font-semibold uppercase tracking-[0.22em] text-neutral-300`}>
            {title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-white/10 px-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-neutral-200 transition hover:border-white/20 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" weight="bold" />
                {copiedLabel}
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                {copyLabel}
              </>
            )}
          </button>
          <a
            href={downloadHref}
            download={downloadLabel}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-sky-300/20 bg-sky-300/10 px-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-sky-100 transition hover:border-sky-300/35 hover:bg-sky-300/15"
          >
            <DownloadSimple className="h-3.5 w-3.5" />
            {downloadText}
          </a>
        </div>
      </div>

      <pre className="max-h-[70vh] overflow-y-auto overflow-x-auto whitespace-pre-wrap p-4 font-mono text-[0.8rem] leading-relaxed text-neutral-300 sm:p-5">
        <code>
          {tokens.map((token) => (
            <span key={token.id} className={token.className}>
              {token.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
