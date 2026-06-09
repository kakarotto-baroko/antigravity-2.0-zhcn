<#
.SYNOPSIS
    Apply or restore Antigravity Chinese localization.
.PARAMETER Restore
    Restore the original English version from backups.
.PARAMETER EnableAiUi
    Also enable the experimental AI panel UI bundle translation when the
    installed Antigravity version and UI bundle hash are known-compatible.
.PARAMETER NoProcessPrompt
    Fail instead of prompting when Antigravity is still running. Intended for
    background installers.
.EXAMPLE
    .\apply.ps1
    .\apply.ps1 -EnableAiUi
    .\apply.ps1 -Restore
#>
[CmdletBinding()]
param(
    [switch]$Restore,
    [switch]$EnableAiUi,
    [switch]$NoProcessPrompt,
    [string]$AntigravityPath = "$env:LOCALAPPDATA\Programs\Antigravity",
    [string]$UiMainSource = "$PSScriptRoot\..\main.js"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$AgyExtensions = @(
    "antigravity",
    "antigravity-code-executor",
    "antigravity-dev-containers",
    "antigravity-remote-openssh",
    "antigravity-remote-wsl"
)

function Get-AiUiCompatManifest {
    $compatPath = Join-Path $ProjectRoot "patches\ai-ui-compat.json"
    if (-not (Test-Path $compatPath)) {
        return $null
    }
    return Get-Content $compatPath -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Test-BundleHashMatch {
    param(
        [string]$AppVersion,
        [string]$SourcePath
    )

    if (-not (Test-Path $SourcePath)) {
        return $false
    }

    $compat = Get-AiUiCompatManifest
    if (-not $compat) {
        return $false
    }

    $sourceHash = Get-Sha256OrNull $SourcePath
    return $null -ne ($compat.supportedBundles | Where-Object {
        $_.antigravityVersion -eq $AppVersion -and
        $_.sourceSha256.ToUpperInvariant() -eq $sourceHash
    } | Select-Object -First 1)
}

function Get-LatestAntigravityPortFromLog {
    $mainLog = Join-Path $env:APPDATA "Antigravity\logs\main.log"
    if (-not (Test-Path $mainLog)) {
        return $null
    }

    $match = Select-String -Path $mainLog -Pattern 'Local:\s+https://127\.0\.0\.1:(\d+)/' | Select-Object -Last 1
    if (-not $match) {
        return $null
    }

    return $match.Matches[0].Groups[1].Value
}

function Save-LiveUiMainBundle {
    param(
        [string]$Port,
        [string]$OutputPath
    )

    if (-not $Port) {
        return $false
    }

    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if (-not $curl) {
        return $false
    }

    & $curl.Path -k "https://127.0.0.1:$Port/main.js" -o $OutputPath | Out-Null
    return (Test-Path $OutputPath) -and ((Get-Item $OutputPath).Length -gt 0)
}

function Resolve-UiMainSource {
    param([string]$RequestedPath)

    $appVersion = Get-AntigravityVersion $AntigravityPath
    $cachePath = Join-Path $env:LOCALAPPDATA "Temp\agy_ui_main_$($appVersion -replace '[^0-9A-Za-z._-]', '_').js"

    if ((Test-Path $RequestedPath) -and (Test-BundleHashMatch -AppVersion $appVersion -SourcePath $RequestedPath)) {
        return $RequestedPath
    }

    if ((Test-Path $cachePath) -and (Test-BundleHashMatch -AppVersion $appVersion -SourcePath $cachePath)) {
        return $cachePath
    }

    $processes = Get-Process -Name "Antigravity" -ErrorAction SilentlyContinue
    if ($processes) {
        $port = Get-LatestAntigravityPortFromLog
        if ((Save-LiveUiMainBundle -Port $port -OutputPath $cachePath) -and
            (Test-BundleHashMatch -AppVersion $appVersion -SourcePath $cachePath)) {
            Write-Host "  Resolved UI bundle from running Antigravity session" -ForegroundColor Green
            return $cachePath
        }
    }

    return $RequestedPath
}

function Get-Sha256OrNull {
    param([string]$Path)
    if (Test-Path $Path) {
        return (Get-FileHash -Algorithm SHA256 -Path $Path).Hash.ToUpperInvariant()
    }
    return $null
}

function Get-AntigravityVersion {
    param([string]$InstallPath)
    $exePath = Join-Path $InstallPath "Antigravity.exe"
    if (Test-Path $exePath) {
        return (Get-Item $exePath).VersionInfo.FileVersion
    }
    return $null
}

function Write-InstallState {
    param(
        [string]$Mode,
        [string]$Reason,
        [hashtable]$Extra = @{}
    )

    $stateDir = Join-Path $ProjectRoot "releases"
    New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
    $state = @{
        mode = $Mode
        reason = $Reason
        writtenAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssK")
        antigravityVersion = Get-AntigravityVersion $AntigravityPath
        appAsarSha256 = Get-Sha256OrNull (Join-Path $AntigravityPath "resources\app.asar")
        nlsSha256 = Get-Sha256OrNull (Join-Path $AntigravityPath "resources\app\out\nls.messages.json")
    }
    foreach ($key in $Extra.Keys) {
        $state[$key] = $Extra[$key]
    }
    $state | ConvertTo-Json -Depth 5 | Out-File (Join-Path $stateDir "install-state.json") -Encoding UTF8
}

function Stop-OrFailIfRunning {
    $processes = Get-Process -Name "Antigravity" -ErrorAction SilentlyContinue
    if (-not $processes) {
        return
    }

    if ($NoProcessPrompt) {
        throw "Antigravity is currently running. Close it before applying localization."
    }

    Write-Warning "Antigravity is currently running! Please close it first."
    $choice = Read-Host "Kill running processes now? (y/N)"
    if ($choice -eq "y" -or $choice -eq "Y") {
        Stop-Process -Name "Antigravity" -Force
        Start-Sleep -Seconds 2
        Write-Host "  Stopped Antigravity processes." -ForegroundColor Green
    } else {
        Write-Host "Please close the application and run this script again." -ForegroundColor Yellow
        exit 0
    }
}

function Invoke-AsarPack {
    param(
        [string]$SourceDir,
        [string]$AsarPath
    )

    $tmpAsar = "$AsarPath.tmp"
    if (Test-Path $tmpAsar) {
        Remove-Item $tmpAsar -Force
    }

    asar pack $SourceDir $tmpAsar
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $tmpAsar)) {
        throw "Failed to pack app.asar."
    }

    Copy-Item $tmpAsar $AsarPath -Force
    Remove-Item $tmpAsar -Force
}

function Set-CustomSchemeMode {
    param([ValidateSet("core", "ai-ui")][string]$Mode)

    $asarPath = Join-Path $AntigravityPath "resources\app.asar"
    $extractedPath = Join-Path $AntigravityPath "resources\extracted_asar"
    $customSchemeTarget = Join-Path $extractedPath "dist\customScheme.js"
    $patchPath = Join-Path $ProjectRoot "patches\customScheme.$Mode.js"

    if (-not (Test-Path $extractedPath)) {
        if (-not (Test-Path "$asarPath.bak")) {
            Copy-Item $asarPath "$asarPath.bak" -Force
            Write-Host "  Created backup of app.asar" -ForegroundColor Green
        }
        Write-Host "  Extracting app.asar..." -ForegroundColor White
        asar extract $asarPath $extractedPath
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path $extractedPath)) {
            throw "Failed to extract app.asar."
        }
    }

    if (Test-Path $extractedPath) {
        if (-not (Test-Path "$asarPath.bak")) {
            Copy-Item $asarPath "$asarPath.bak" -Force
            Write-Host "  Created backup of app.asar" -ForegroundColor Green
        }

        if (-not (Test-Path $patchPath)) {
            throw "Missing customScheme patch: $patchPath"
        }

        Copy-Item $patchPath $customSchemeTarget -Force
        Write-Host "  Applied $Mode app.asar patch template" -ForegroundColor Green
        Invoke-AsarPack -SourceDir $extractedPath -AsarPath $asarPath
        Write-Host "  Repacked app.asar successfully" -ForegroundColor Green
        return
    }

    if ($Mode -eq "core" -and (Test-Path "$asarPath.bak")) {
        Copy-Item "$asarPath.bak" $asarPath -Force
        Write-Host "  Restored app.asar from backup" -ForegroundColor Green
        return
    }

    throw "Unpacked directory not found: $extractedPath"
}

function Test-AiUiCompatibility {
    $appVersion = Get-AntigravityVersion $AntigravityPath
    $sourceHash = Get-Sha256OrNull $UiMainSource
    $compat = Get-AiUiCompatManifest

    if (-not (Test-Path $UiMainSource)) {
        return @{
            compatible = $false
            reason = "UI source bundle not found"
            appVersion = $appVersion
            sourceHash = $sourceHash
        }
    }

    if (-not $compat) {
        return @{
            compatible = $false
            reason = "AI UI compatibility manifest not found"
            appVersion = $appVersion
            sourceHash = $sourceHash
        }
    }
    $match = $compat.supportedBundles | Where-Object {
        $_.antigravityVersion -eq $appVersion -and
        $_.sourceSha256.ToUpperInvariant() -eq $sourceHash
    } | Select-Object -First 1

    if ($match) {
        return @{
            compatible = $true
            reason = "matched supported bundle"
            appVersion = $appVersion
            sourceHash = $sourceHash
        }
    }

    return @{
        compatible = $false
        reason = "version or UI bundle hash mismatch"
        appVersion = $appVersion
        sourceHash = $sourceHash
    }
}

function Apply-CoreTranslations {
    $appOut = Join-Path $AntigravityPath "resources\app\out"
    if (-not (Test-Path $appOut)) {
        Write-Host "  Skipping core NLS translations (not applicable for this version layout; handled by pre-installed language pack)." -ForegroundColor Yellow
        return
    }

    Write-Host "  Applying VS Code core NLS translations..." -ForegroundColor White
    if (-not (Test-Path "$appOut\nls.messages.json.bak")) {
        Copy-Item "$appOut\nls.messages.json" "$appOut\nls.messages.json.bak" -Force
    }
    $translationFile = Join-Path $ProjectRoot "translations\nls.messages.zh-CN.json"
    Copy-Item $translationFile "$appOut\nls.messages.json" -Force
    Write-Host "  Applied NLS translations" -ForegroundColor Green

    Write-Host "  Applying product.json translations..." -ForegroundColor White
    $productPath = Join-Path $AntigravityPath "resources\app\product.json"
    if (-not (Test-Path "$productPath.bak")) {
        Copy-Item $productPath "$productPath.bak" -Force
    }
    Copy-Item (Join-Path $ProjectRoot "translations\product.json") $productPath -Force
    Write-Host "  Applied product.json translations" -ForegroundColor Green

    Write-Host "  Applying extension translations..." -ForegroundColor White
    $extDir = Join-Path $AntigravityPath "resources\app\extensions"
    foreach ($ext in $AgyExtensions) {
        $extPath = Join-Path $extDir $ext
        if (Test-Path $extPath) {
            $pkgPath = Join-Path $extPath "package.json"
            if (-not (Test-Path "$pkgPath.bak")) {
                Copy-Item $pkgPath "$pkgPath.bak" -Force
            }
            $extPkgTrans = Join-Path $ProjectRoot "translations\extensions\$ext\package.json"
            if (Test-Path $extPkgTrans) {
                Copy-Item $extPkgTrans $pkgPath -Force
                Write-Host "  Applied $ext/package.json translations" -ForegroundColor Green
            }
        }
    }
}

Write-Host "=== Antigravity Chinese Localization Tool ===" -ForegroundColor Cyan

$asarPath = Join-Path $AntigravityPath "resources\app.asar"
if (-not (Test-Path $asarPath)) {
    Write-Error "Antigravity installation or app.asar not found at: $AntigravityPath"
    exit 1
}

if ($Restore) {
    Write-Host "`n[Restore] Restoring original English files..." -ForegroundColor Yellow
    Stop-OrFailIfRunning

    $asarPath = Join-Path $AntigravityPath "resources\app.asar"
    if (Test-Path "$asarPath.bak") {
        Copy-Item "$asarPath.bak" $asarPath -Force
        Write-Host "  Restored app.asar" -ForegroundColor Green
    }

    $extractedPath = Join-Path $AntigravityPath "resources\extracted_asar"
    if (Test-Path $extractedPath) {
        Remove-Item $extractedPath -Recurse -Force
        Write-Host "  Cleaned up extracted_asar directory" -ForegroundColor Green
    }

    $appOut = Join-Path $AntigravityPath "resources\app\out"
    $backupFile = "$appOut\nls.messages.json.bak"
    if (Test-Path $backupFile) {
        Copy-Item $backupFile "$appOut\nls.messages.json" -Force
        Write-Host "  Restored nls.messages.json" -ForegroundColor Green
    }

    $productPath = Join-Path $AntigravityPath "resources\app\product.json"
    if (Test-Path "$productPath.bak") {
        Copy-Item "$productPath.bak" $productPath -Force
        Write-Host "  Restored product.json" -ForegroundColor Green
    }

    $extDir = Join-Path $AntigravityPath "resources\app\extensions"
    if (Test-Path $extDir) {
        foreach ($ext in $AgyExtensions) {
            $pkgPath = Join-Path $extDir "$ext\package.json"
            if (Test-Path "$pkgPath.bak") {
                Copy-Item "$pkgPath.bak" $pkgPath -Force
                Write-Host "  Restored $ext/package.json" -ForegroundColor Green
            }
        }
    }

    $translatedUiFile = Join-Path "$env:APPDATA\Antigravity" "zh_cn_ui_main.js"
    if (Test-Path $translatedUiFile) {
        Remove-Item $translatedUiFile -Force
        Write-Host "  Cleaned up translated UI main bundle" -ForegroundColor Green
    }

    Write-InstallState -Mode "restored" -Reason "restore requested"
    Write-Host "`nRestore complete! Please restart Antigravity." -ForegroundColor Cyan
    exit 0
}

Write-Host "`n[Install] Applying Chinese localization..." -ForegroundColor Yellow
Write-Host "  Antigravity version: $(Get-AntigravityVersion $AntigravityPath)" -ForegroundColor White
$UiMainSource = Resolve-UiMainSource -RequestedPath $UiMainSource
Write-Host "  UI source bundle: $UiMainSource" -ForegroundColor White
Stop-OrFailIfRunning

$installMode = "stable-core"
$installReason = "AI UI patch not requested"
$aiCompat = $null

if ($EnableAiUi) {
    $aiCompat = Test-AiUiCompatibility
    if ($aiCompat.compatible) {
        Write-Host "  AI UI compatibility check passed." -ForegroundColor Green
        node "$ProjectRoot\scripts\translate_ui.js" --input "$UiMainSource"
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to generate AI UI translation bundle."
        }

        $translatedUiFile = Join-Path "$env:APPDATA\Antigravity" "zh_cn_ui_main.js"
        node --check $translatedUiFile
        if ($LASTEXITCODE -ne 0) {
            throw "Generated AI UI translation bundle failed syntax check."
        }

        Set-CustomSchemeMode -Mode "ai-ui"
        $installMode = "ai-ui-enabled"
        $installReason = "AI UI bundle matched compatibility manifest"
    } else {
        Write-Warning "AI UI patch skipped: $($aiCompat.reason). Core localization will still be applied."
        $translatedUiFile = Join-Path "$env:APPDATA\Antigravity" "zh_cn_ui_main.js"
        if (Test-Path $translatedUiFile) {
            Remove-Item $translatedUiFile -Force
        }
        Set-CustomSchemeMode -Mode "core"
        $installMode = "ai-ui-skipped-version-mismatch"
        $installReason = $aiCompat.reason
    }
} else {
    $translatedUiFile = Join-Path "$env:APPDATA\Antigravity" "zh_cn_ui_main.js"
    if (Test-Path $translatedUiFile) {
        Remove-Item $translatedUiFile -Force
        Write-Host "  Removed stale AI UI translation bundle" -ForegroundColor Green
    }
    Set-CustomSchemeMode -Mode "core"
}

Apply-CoreTranslations

$stateExtra = @{}
if ($aiCompat) {
    $stateExtra["aiUiSourceSha256"] = $aiCompat.sourceHash
    $stateExtra["aiUiCompatibilityReason"] = $aiCompat.reason
}
Write-InstallState -Mode $installMode -Reason $installReason -Extra $stateExtra

Write-Host "`nLocalization applied successfully! Mode: $installMode. Please restart Antigravity manually." -ForegroundColor Cyan
