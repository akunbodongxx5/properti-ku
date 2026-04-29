@echo off
title PropertiKu — preview EXPERIMENT (monetization)
cd /d "%~dp0"
set PORT=61037
echo.
echo PropertiKu: branch EXPERIMENT / monetization — port %PORT%
echo Checkout: git checkout experiment/monetization
echo Jangan tutup jendela ini selama preview.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
echo.
if errorlevel 1 pause
