# Quality Assemble updater.
# Downloads the latest GitHub Release asset (quality-assemble.zip) and replaces the installed extension files.
# User data is NOT in this folder (it lives in Chrome's storage), so replacing files is safe.
# -Silencioso: no console output or prompts (used by the Windows startup shortcut).
param([switch]$Silencioso)

$ErrorActionPreference = 'Stop'
$Repo  = 'gadct/quality-assemble'
$Asset = 'quality-assemble.zip'
$Base  = Join-Path $env:LOCALAPPDATA 'QualityAssemble'
$Dest  = Join-Path $Base 'extension'
$LogFile = Join-Path $Base 'actualizar.log'
$Headers = @{ 'User-Agent' = 'QualityAssemble-Updater'; 'Accept' = 'application/vnd.github+json' }

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
if (-not (Test-Path $Base)) { New-Item -ItemType Directory -Path $Base | Out-Null }

function Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
    if (-not $Silencioso) { Write-Host $msg }
}

function Finish($code) {
    if (-not $Silencioso) { Read-Host 'Presiona Enter para cerrar' | Out-Null }
    exit $code
}

function Get-ManifestVersion($folder) {
    $mf = Join-Path $folder 'manifest.json'
    if (-not (Test-Path $mf)) { return [version]'0.0.0' }
    return [version]((Get-Content $mf -Raw -Encoding UTF8 | ConvertFrom-Json).version)
}

$tmp = Join-Path $env:TEMP ('qa-update-' + [guid]::NewGuid())
try {
    $rel = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -Headers $Headers -TimeoutSec 30
    $remote = [version]($rel.tag_name.TrimStart('v'))
    $local = Get-ManifestVersion $Dest

    if ($remote -le $local) {
        Log "Quality Assemble ya esta actualizado (version $local)."
        Finish 0
    }

    $item = $rel.assets | Where-Object { $_.name -eq $Asset } | Select-Object -First 1
    if (-not $item) { throw "El release $($rel.tag_name) no incluye $Asset." }

    New-Item -ItemType Directory -Path $tmp | Out-Null
    $zip = Join-Path $tmp $Asset
    $staging = Join-Path $tmp 'extension'
    Log "Descargando version $remote..."
    Invoke-WebRequest -Uri $item.browser_download_url -OutFile $zip -Headers $Headers -UseBasicParsing -TimeoutSec 120
    Expand-Archive -Path $zip -DestinationPath $staging -Force

    $newVersion = Get-ManifestVersion $staging
    if ($newVersion -ne $remote) { throw "El zip trae la version $newVersion y el release dice $remote. No se instalo nada." }

    # Swap folders: keep the old copy until the new one is in place.
    $old = "$Dest.old"
    if (Test-Path $old) { Remove-Item $old -Recurse -Force }
    if (Test-Path $Dest) { Rename-Item -Path $Dest -NewName (Split-Path $old -Leaf) }
    try {
        Copy-Item -Path $staging -Destination $Dest -Recurse
    } catch {
        if (Test-Path $Dest) { Remove-Item $Dest -Recurse -Force }
        if (Test-Path $old) { Rename-Item -Path $old -NewName (Split-Path $Dest -Leaf) }
        throw
    }
    if (Test-Path $old) { Remove-Item $old -Recurse -Force -ErrorAction SilentlyContinue }

    Log "Actualizado de $local a $remote. Abre Quality Assemble y presiona 'Aplicar ahora', o reinicia Chrome."
    Finish 0
} catch {
    Log "No se pudo actualizar: $($_.Exception.Message)"
    Finish 1
} finally {
    if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
}
