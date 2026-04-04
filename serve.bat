@echo off
title PropertiKu — dev server
cd /d "%~dp0"
echo.
echo PropertiKu: menjalankan server lokal...
echo Jangan tutup jendela ini selama pakai app di browser.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
echo.
if errorlevel 1 pause
