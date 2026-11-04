@echo off
rem Double-click to install Quality Assemble. Runs instalar.ps1 without changing the system execution policy.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar.ps1"
pause
