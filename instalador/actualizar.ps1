# Quality Assemble updater.
# Downloads the latest GitHub Release and replaces the installed extension folders:
#   %LOCALAPPDATA%\QualityAssemble\extension          (Chrome, Edge, Opera, Opera GX, Brave, Vivaldi)
#   %LOCALAPPDATA%\QualityAssemble\extension-firefox  (Firefox)
# User data is NOT in these folders (it lives in the browser's storage), so replacing files is safe.
# -Silencioso: no console output or prompts (used by the Windows startup shortcut and the installer).
param([switch]$Silencioso)

$ErrorActionPreference = 'Stop'
$Repo = 'gadct/quality-assemble'
$Base = Join-Path $env:LOCALAPPDATA 'QualityAssemble'
$LogFile = Join-Path $Base 'actualizar.log'
$Headers = @{ 'User-Agent' = 'QualityAssemble-Updater'; 'Accept' = 'application/vnd.github+json' }
$Targets = @(
    @{ Asset = 'quality-assemble.zip';         Folder = 'extension' },
    @{ Asset = 'quality-assemble-firefox.zip'; Folder = 'extension-firefox' }
)

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
if (-not (Test-Path $Base)) { New-Item -ItemType Directory -Path $Base | Out-Null }

function Log($msg) {
    Add-Content -Path $LogFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg" -Encoding UTF8
    if (-not $Silencioso) { Write-Host $msg }
}

function Get-ManifestVersion($folder) {
    $mf = Join-Path $folder 'manifest.json'
    if (-not (Test-Path $mf)) { return [version]'0.0.0' }
    return [version]((Get-Content $mf -Raw -Encoding UTF8 | ConvertFrom-Json).version)
}

function Update-Target($rel, $remote, $target, $tmp) {
    $dest = Join-Path $Base $target.Folder
    $local = Get-ManifestVersion $dest
    if ($remote -le $local) { return "$($target.Folder): ya en $local" }

    $item = $rel.assets | Where-Object { $_.name -eq $target.Asset } | Select-Object -First 1
    if (-not $item) { return "$($target.Folder): el release no trae $($target.Asset), se omite" }

    $zip = Join-Path $tmp $target.Asset
    $staging = Join-Path $tmp $target.Folder
    Invoke-WebRequest -Uri $item.browser_download_url -OutFile $zip -Headers $Headers -UseBasicParsing -TimeoutSec 120
    Expand-Archive -Path $zip -DestinationPath $staging -Force

    $newVersion = Get-ManifestVersion $staging
    if ($newVersion -ne $remote) { throw "$($target.Asset) trae la version $newVersion y el release dice $remote" }

    # Copy fully next to the install, then swap with two renames.
    # The extension may reload itself at any moment, so it must never see a half-copied folder.
    $new = "$dest.new"
    $old = "$dest.old"
    foreach ($p in $new, $old) { if (Test-Path $p) { Remove-Item $p -Recurse -Force } }
    Copy-Item -Path $staging -Destination $new -Recurse
    if (Test-Path $dest) { Rename-Item -Path $dest -NewName (Split-Path $old -Leaf) }
    try {
        Rename-Item -Path $new -NewName (Split-Path $dest -Leaf)
    } catch {
        if (Test-Path $old) { Rename-Item -Path $old -NewName (Split-Path $dest -Leaf) }
        throw
    }
    if (Test-Path $old) { Remove-Item $old -Recurse -Force -ErrorAction SilentlyContinue }
    return "$($target.Folder): actualizado de $local a $remote"
}

$tmp = Join-Path $env:TEMP ('qa-update-' + [guid]::NewGuid())
$code = 0
try {
    $rel = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -Headers $Headers -TimeoutSec 30
    $remote = [version]($rel.tag_name.TrimStart('v'))
    New-Item -ItemType Directory -Path $tmp | Out-Null
    foreach ($t in $Targets) { Log (Update-Target $rel $remote $t $tmp) }
    Log "Listo (ultima version publicada: $remote). Los cambios se aplican solos con la herramienta cerrada, o al reiniciar el navegador."
} catch {
    Log "No se pudo actualizar: $($_.Exception.Message)"
    $code = 1
} finally {
    if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
}

if (-not $Silencioso) { Read-Host 'Presiona Enter para cerrar' | Out-Null }
exit $code
