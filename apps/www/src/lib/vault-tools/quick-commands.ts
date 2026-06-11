export type QuickCommandLanguage = "shell" | "powershell";

export type QuickCommandSnippet = {
  id: string;
  titleKey?: string;
  language: QuickCommandLanguage;
  command: string;
};

export type QuickCommand = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  badgeKey: string;
  categoryKey?: string;
  language: QuickCommandLanguage;
  tags: readonly string[];
  command?: string;
  snippets?: readonly QuickCommandSnippet[];
};

const CODEX_INSTALL_BASH_COMMAND = `command -v codex >/dev/null 2>&1 || curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh; unalias codex 2>/dev/null; sed -i '/^[[:space:]]*alias[[:space:]]\\+codex=/d;/^[[:space:]]*function[[:space:]]\\+codex[[:space:]]*{/d;/^[[:space:]]*codex()[[:space:]]*{/d' ~/.bashrc; printf '\\n%s\\n' "alias codex='codex --yolo'" >> ~/.bashrc; source ~/.bashrc; alias codex`;

const CODEX_INSTALL_WINDOWS_PROFILES_COMMAND = `if (-not (Get-Command codex -ErrorAction SilentlyContinue)) { powershell -ExecutionPolicy ByPass -Command "irm https://chatgpt.com/codex/install.ps1 | iex" }; $docs = [Environment]::GetFolderPath('MyDocuments'); $profiles = @((Join-Path $docs 'WindowsPowerShell\\profile.ps1'), (Join-Path $docs 'PowerShell\\profile.ps1')); foreach ($profilePath in $profiles) { $dir = Split-Path $profilePath -Parent; if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }; if (-not (Test-Path $profilePath)) { New-Item -ItemType File -Path $profilePath -Force | Out-Null }; $content = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue; $content = $content -replace '(?ms)^\\s*function\\s+codex\\s*\\{.*?^\\s*\\}\\s*$', ''; $content = $content -replace '(?m)^\\s*(Set-Alias|New-Alias)\\s+codex\\b.*$', ''; $content = $content -replace '(?m)^\\s*Remove-Item\\s+Alias:codex\\b.*$', ''; Set-Content -Path $profilePath -Value $content -Encoding UTF8; Add-Content -Path $profilePath -Value 'Remove-Item Alias:codex -ErrorAction SilentlyContinue'; Add-Content -Path $profilePath -Value 'function codex { $cmd = Get-Command codex.exe -ErrorAction SilentlyContinue; if (-not $cmd) { $cmd = Get-Command codex.cmd -ErrorAction SilentlyContinue }; if (-not $cmd) { $cmd = Get-Command codex.ps1 -ErrorAction SilentlyContinue }; if (-not $cmd) { throw "codex executable not found" }; & $cmd.Source --yolo @args }' }; . $PROFILE; Get-Command codex`;

export const QUICK_COMMANDS: readonly QuickCommand[] = [
  {
    id: "debian-docker-bootstrap",
    titleKey: "commands.debianDockerBootstrap.title",
    descriptionKey: "commands.debianDockerBootstrap.description",
    badgeKey: "commands.debianDockerBootstrap.badge",
    language: "shell",
    tags: ["Debian", "Ubuntu", "Docker"],
    command:
      "apt install curl -y && apt install sudo -y && curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && rm get-docker.sh",
  },
  {
    id: "jellyfin-ts-to-mp4",
    titleKey: "commands.jellyfinTsToMp4.title",
    descriptionKey: "commands.jellyfinTsToMp4.description",
    badgeKey: "commands.jellyfinTsToMp4.badge",
    language: "shell",
    tags: ["Jellyfin", "FFmpeg", "Media"],
    command:
      'find /var/docker/jellyfin/movies -type f -name \'*.ts\' -exec bash -c \'for f in "$@"; do mp4="${f%.ts}.mp4"; ffmpeg -i "$f" -c:v copy -c:a aac -b:a 192k -bsf:a aac_adtstoasc "$mp4" && [ -f "$mp4" ] && rm -v "$f"; done\' _ {} +',
  },
  {
    id: "codex-install",
    titleKey: "commands.codexInstall.title",
    descriptionKey: "commands.codexInstall.description",
    badgeKey: "commands.codexInstall.badge",
    categoryKey: "categories.codexInstall",
    language: "powershell",
    tags: ["Codex", "PowerShell", "Windows"],
    snippets: [
      {
        id: "bash",
        titleKey: "commands.codexInstall.snippets.bash",
        language: "shell",
        command: CODEX_INSTALL_BASH_COMMAND,
      },
      {
        id: "powershell",
        titleKey: "commands.codexInstall.snippets.powershell",
        language: "powershell",
        command: CODEX_INSTALL_WINDOWS_PROFILES_COMMAND,
      },
    ],
  },
];
