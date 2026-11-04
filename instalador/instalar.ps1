# Quality Assemble installer (run once, no admin needed).
# 1. Copies the updater to %LOCALAPPDATA%\QualityAssemble
# 2. Downloads the latest release into %LOCALAPPDATA%\QualityAssemble\extension
# 3. Adds a hidden updater at Windows startup and an "Actualizar Quality Assemble" desktop shortcut
$ErrorActionPreference = 'Stop'

$Base = Join-Path $env:LOCALAPPDATA 'QualityAssemble'
$Dest = Join-Path $Base 'extension'
$Updater = Join-Path $Base 'actualizar.ps1'

if (-not (Test-Path $Base)) { New-Item -ItemType Directory -Path $Base | Out-Null }
Copy-Item -Path (Join-Path $PSScriptRoot 'actualizar.ps1') -Destination $Updater -Force

Write-Host 'Descargando Quality Assemble...'
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Updater -Silencioso
if (-not (Test-Path (Join-Path $Dest 'manifest.json'))) {
    Write-Host ''
    Write-Host 'No se pudo descargar la extension. Revisa la conexion a internet y el archivo:'
    Write-Host (Join-Path $Base 'actualizar.log')
    exit 1
}

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

Set-Clipboard -Value $Dest

Write-Host ''
Write-Host 'Listo. Falta un paso en Chrome (solo esta vez):'
Write-Host '  1. Abre Chrome y escribe en la barra: chrome://extensions'
Write-Host '  2. Activa "Modo de desarrollador" (arriba a la derecha).'
Write-Host '  3. Presiona "Cargar descomprimida".'
Write-Host '  4. Pega esta ruta en la barra de la ventana (ya esta copiada) y presiona Seleccionar carpeta:'
Write-Host "     $Dest"
Write-Host '  5. Fija el icono de Quality Assemble y recarga (F5) las pestanas abiertas.'
Write-Host ''
Write-Host 'Las actualizaciones se instalan solas al iniciar Windows.'
