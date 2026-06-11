param(
    [switch]$StrictSymbolicLink
)

$ErrorActionPreference = "Stop"

$UserHome = $env:USERPROFILE
$CentralAgentRoot = Join-Path $UserHome ".agents"
$CentralSkillsPath = Join-Path $CentralAgentRoot "skills"
$BackupRoot = Join-Path $CentralAgentRoot "backups"
$TimeStamp = Get-Date -Format "yyyyMMdd-HHmmss"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Ok "Created directory: $Path"
    }
}

function Test-ReparsePoint {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return $false
    }

    $Item = Get-Item -LiteralPath $Path -Force
    return (($Item.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq [IO.FileAttributes]::ReparsePoint)
}

function Copy-DirectoryContentSafe {
    param(
        [string]$Source,
        [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        return
    }

    Ensure-Directory -Path $Destination

    Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
        $TargetPath = Join-Path $Destination $_.Name

        if (-not (Test-Path -LiteralPath $TargetPath)) {
            Copy-Item -LiteralPath $_.FullName -Destination $TargetPath -Recurse -Force
            Write-Ok "Merged existing item: $($_.FullName)"
        }
        else {
            Write-Warn "Skipped existing item during merge: $TargetPath"
        }
    }
}

function New-SkillLink {
    param(
        [string]$LinkPath,
        [string]$TargetPath
    )

    $Parent = Split-Path -Parent $LinkPath
    Ensure-Directory -Path $Parent

    if (Test-Path -LiteralPath $LinkPath) {
        if (Test-ReparsePoint -Path $LinkPath) {
            Remove-Item -LiteralPath $LinkPath -Force
            Write-Info "Removed existing link: $LinkPath"
        }
        else {
            $SafeBackupName = ($LinkPath.Replace($UserHome, "").TrimStart("\") -replace "[\\/:*?`"<>|]", "_") + "_$TimeStamp"
            $BackupPath = Join-Path $BackupRoot $SafeBackupName

            Ensure-Directory -Path $BackupRoot
            Copy-DirectoryContentSafe -Source $LinkPath -Destination $TargetPath
            Move-Item -LiteralPath $LinkPath -Destination $BackupPath -Force
            Write-Warn "Existing folder moved to backup: $BackupPath"
        }
    }

    try {
        New-Item -ItemType SymbolicLink -Path $LinkPath -Target $TargetPath -Force | Out-Null
        Write-Ok "Created symbolic link: $LinkPath -> $TargetPath"
    }
    catch {
        if ($StrictSymbolicLink) {
            throw
        }

        Write-Warn "Symbolic link failed, trying junction: $LinkPath"

        if (Test-Path -LiteralPath $LinkPath) {
            Remove-Item -LiteralPath $LinkPath -Force
        }

        New-Item -ItemType Junction -Path $LinkPath -Target $TargetPath -Force | Out-Null
        Write-Ok "Created junction: $LinkPath -> $TargetPath"
    }
}

function Add-SkillsProfileBlock {
    param([string]$ProfilePath)

    $ProfileDirectory = Split-Path -Parent $ProfilePath
    Ensure-Directory -Path $ProfileDirectory

    if (-not (Test-Path -LiteralPath $ProfilePath)) {
        New-Item -ItemType File -Path $ProfilePath -Force | Out-Null
        Write-Ok "Created profile: $ProfilePath"
    }

    $ProfileContent = Get-Content -LiteralPath $ProfilePath -Raw -ErrorAction SilentlyContinue

    $NeedsOpenSkills = $ProfileContent -notmatch "function\s+open-skills" -and $ProfileContent -notmatch "Set-Alias\s+open-skills"
    $NeedsSkills = $ProfileContent -notmatch "function\s+skills" -and $ProfileContent -notmatch "Set-Alias\s+skills"
    $NeedsShowSkills = $ProfileContent -notmatch "function\s+show-skills" -and $ProfileContent -notmatch "Set-Alias\s+show-skills"
    $NeedsAddSkill = $ProfileContent -notmatch "function\s+add-skill" -and $ProfileContent -notmatch "Set-Alias\s+add-skill"

    if (-not $NeedsOpenSkills -and -not $NeedsSkills -and -not $NeedsShowSkills -and -not $NeedsAddSkill) {
        Write-Warn "Profile already contains all skills shortcuts: $ProfilePath"
        return
    }

    $Block = "`n# Agent skills`n"

    if ($NeedsOpenSkills) {
        $Block += 'function open-skills { Invoke-Item "$env:USERPROFILE\.agents\skills" }' + "`n"
    }

    if ($NeedsSkills) {
        $Block += 'function skills { Invoke-Item "$env:USERPROFILE\.agents\skills" }' + "`n"
    }

    if ($NeedsShowSkills) {
        $Block += @'
function show-skills {
    $SkillsPath = Join-Path $env:USERPROFILE ".agents\skills"

    if (-not (Test-Path -LiteralPath $SkillsPath)) {
        Write-Host "[WARN] Skills folder not found: $SkillsPath" -ForegroundColor Yellow
        return
    }

    Get-ChildItem -LiteralPath $SkillsPath -Filter "*.md" -File -Recurse | Sort-Object FullName | Select-Object @{Name="Name";Expression={$_.Name}}, @{Name="RelativePath";Expression={$_.FullName.Replace($SkillsPath, "").TrimStart("\")}}, FullName
}
'@ + "`n"
    }

    if ($NeedsAddSkill) {
        $Block += @'
function add-skill {
    $SkillsPath = Join-Path $env:USERPROFILE ".agents\skills"

    if (-not (Test-Path -LiteralPath $SkillsPath)) {
        New-Item -ItemType Directory -Path $SkillsPath -Force | Out-Null
    }

    $SkillName = Read-Host "Skill name"

    if ([string]::IsNullOrWhiteSpace($SkillName)) {
        Write-Host "[WARN] No skill name entered." -ForegroundColor Yellow
        return
    }

    $SafeName = $SkillName.Trim()
    $InvalidChars = [IO.Path]::GetInvalidFileNameChars()

    foreach ($Char in $InvalidChars) {
        $SafeName = $SafeName.Replace($Char, "-")
    }

    $SafeName = $SafeName -replace "\s+", "-"
    $SafeName = $SafeName -replace "-+", "-"
    $SafeName = $SafeName.Trim("-")

    if ([string]::IsNullOrWhiteSpace($SafeName)) {
        Write-Host "[WARN] Invalid skill name." -ForegroundColor Yellow
        return
    }

    if (-not $SafeName.EndsWith(".md", [StringComparison]::OrdinalIgnoreCase)) {
        $SafeName = "$SafeName.md"
    }

    $SkillFile = Join-Path $SkillsPath $SafeName

    if (-not (Test-Path -LiteralPath $SkillFile)) {
        $Title = [IO.Path]::GetFileNameWithoutExtension($SafeName)
        Set-Content -LiteralPath $SkillFile -Value "# $Title`n" -Encoding UTF8
        Write-Host "[OK] Created skill: $SkillFile" -ForegroundColor Green
    }
    else {
        Write-Host "[WARN] Skill already exists: $SkillFile" -ForegroundColor Yellow
    }

    $CodeCommand = Get-Command "code" -ErrorAction SilentlyContinue

    if ($CodeCommand) {
        Start-Process -FilePath "code" -ArgumentList "`"$SkillFile`""
    }
    else {
        Start-Process -FilePath "notepad.exe" -ArgumentList "`"$SkillFile`""
    }
}
'@ + "`n"
    }

    Add-Content -LiteralPath $ProfilePath -Value $Block
    Write-Ok "Added missing skills shortcuts to profile: $ProfilePath"
}

Write-Info "Central skills path: $CentralSkillsPath"

Ensure-Directory -Path $CentralAgentRoot
Ensure-Directory -Path $CentralSkillsPath
Ensure-Directory -Path $BackupRoot

$SkillLinkTargets = @(
    ".claude\skills",
    ".cursor\skills",
    ".codex\skills",
    ".openai\skills",
    ".opencode\skills",
    ".gemini\skills",
    ".continue\skills",
    ".aider\skills",
    ".cline\skills",
    ".roo\skills",
    ".windsurf\skills"
)

$UniqueTargets = $SkillLinkTargets | Sort-Object -Unique

foreach ($RelativePath in $UniqueTargets) {
    $FullLinkPath = Join-Path $UserHome $RelativePath
    New-SkillLink -LinkPath $FullLinkPath -TargetPath $CentralSkillsPath
}

$WindowsPowerShellProfile = Join-Path $UserHome "Documents\WindowsPowerShell\profile.ps1"
$PowerShellCoreProfile = Join-Path $UserHome "Documents\PowerShell\profile.ps1"

Add-SkillsProfileBlock -ProfilePath $WindowsPowerShellProfile
Add-SkillsProfileBlock -ProfilePath $PowerShellCoreProfile

Write-Host ""
Write-Ok "Done. Central folder: $CentralSkillsPath"
Write-Info "Commands: open-skills, skills, show-skills, add-skill"

if (-not $StrictSymbolicLink) {
    Write-Warn "Junctions were used where symbolic links were unavailable. Run as admin or enable Developer Mode for symlinks."
}
