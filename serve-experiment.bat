@echo off
title LandlordKu — preview EXPERIMENT (monetization)
cd /d "%~dp0"
set PORT=61037
echo.
echo LandlordKu: branch EXPERIMENT / monetization — port %PORT%
echo Pastikan Anda checkout branch: experiment/monetization
echo Jangan tutup jendela ini selama preview.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
echo.
if errorlevel 1 pause
