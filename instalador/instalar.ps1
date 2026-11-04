# Quality Assemble installer. No admin needed. Safe to run again (reinstall / repair).
# Usual way to run it (Windows + R, paste, Enter):
#   powershell -ep bypass -c "irm https://github.com/gadct/quality-assemble/releases/latest/download/instalar.ps1 | iex"
# What it does:
#   1. Downloads the updater to %LOCALAPPDATA%\QualityAssemble and uses it to install the latest release
#   2. Adds a hidden updater at Windows startup and an "Actualizar Quality Assemble" desktop shortcut
#   3. Detects the default browser, copies the path to load, opens its extensions page and a step-by-step guide
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Repo = 'gadct/quality-assemble'
$Base = Join-Path $env:LOCALAPPDATA 'QualityAssemble'
$Updater = Join-Path $Base 'actualizar.ps1'

Write-Host ''
Write-Host 'Instalando Quality Assemble...' -ForegroundColor Cyan
if (-not (Test-Path $Base)) { New-Item -ItemType Directory -Path $Base | Out-Null }

Invoke-WebRequest -Uri "https://github.com/$Repo/releases/latest/download/actualizar.ps1" -OutFile $Updater -UseBasicParsing -Headers @{ 'User-Agent' = 'QualityAssemble-Installer' }
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Updater -Silencioso

$chromium = Join-Path $Base 'extension'
if (-not (Test-Path (Join-Path $chromium 'manifest.json'))) {
    Write-Host ''
    Write-Host 'No se pudo descargar la extension. Revisa la conexion a internet.' -ForegroundColor Red
    Write-Host "Detalle en: $(Join-Path $Base 'actualizar.log')"
    Read-Host 'Presiona Enter para cerrar' | Out-Null
    return
}

# ---- shortcuts ----
$shell = New-Object -ComObject WScript.Shell
$psArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$Updater`""

$startup = $shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Startup')) 'Quality Assemble (actualizador).lnk'))
$startup.TargetPath = 'powershell.exe'
$startup.Arguments = "$psArgs -Silencioso"
$startup.WindowStyle = 7
$startup.Save()

$desk = $shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) 'Actualizar Quality Assemble.lnk'))
$desk.TargetPath = 'powershell.exe'
$desk.Arguments = $psArgs
$desk.Save()

# ---- default browser ----
$progId = $null
try { $progId = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice').ProgId } catch { }
$exe = $null
if ($progId) {
    try {
        $cmd = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\$progId\shell\open\command").'(default)'
        if ($cmd -match '^"([^"]+)"') { $exe = $Matches[1] } elseif ($cmd) { $exe = ($cmd -split ' ')[0] }
    } catch { }
}

# id = guide variant, url = extensions page
$browsers = @(
    @{ Match = 'Opera ?GX'; Id = 'operagx'; Name = 'Opera GX'; Url = 'opera://extensions' },  # ProgId is "Opera GXStable"
    @{ Match = 'Opera';    Id = 'opera';   Name = 'Opera';    Url = 'opera://extensions' },
    @{ Match = 'MSEdge';   Id = 'edge';    Name = 'Edge';     Url = 'edge://extensions' },
    @{ Match = 'Brave';    Id = 'brave';   Name = 'Brave';    Url = 'brave://extensions' },
    @{ Match = 'Vivaldi';  Id = 'vivaldi'; Name = 'Vivaldi';  Url = 'vivaldi://extensions' },
    @{ Match = 'Firefox';  Id = 'firefox'; Name = 'Firefox';  Url = 'about:debugging#/runtime/this-firefox' },
    @{ Match = 'Chrome';   Id = 'chrome';  Name = 'Chrome';   Url = 'chrome://extensions' }
)
$b = $browsers | Where-Object { $progId -and $progId -match $_.Match } | Select-Object -First 1
if (-not $b) { $b = @{ Id = 'otro'; Name = 'tu navegador'; Url = $null } }

if ($b.Id -eq 'firefox') {
    $toLoad = Join-Path $Base 'extension-firefox\manifest.json'
} else {
    $toLoad = $chromium
}
Set-Clipboard -Value $toLoad

$guide = ([uri](Join-Path $chromium 'guia-instalacion.html')).AbsoluteUri + "?b=$($b.Id)"
if ($exe -and (Test-Path $exe)) {
    if ($b.Url) { Start-Process -FilePath $exe -ArgumentList $b.Url; Start-Sleep -Milliseconds 800 }
    Start-Process -FilePath $exe -ArgumentList $guide
} else {
    Start-Process -FilePath (Join-Path $chromium 'guia-instalacion.html')
}

Write-Host ''
Write-Host "Listo. Sigue la guia que se abrio en $($b.Name) (solo esta vez)." -ForegroundColor Green
Write-Host 'Ya esta copiado lo que tienes que pegar:'
Write-Host "  $toLoad"
Write-Host ''
Write-Host 'Las actualizaciones se instalan solas al iniciar Windows.'
Read-Host 'Presiona Enter para cerrar esta ventana' | Out-Null
