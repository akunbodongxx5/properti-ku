@echo off
cd /d "%~dp0"
set NO_BROWSER=1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
