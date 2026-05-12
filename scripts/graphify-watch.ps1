# Watch repo and auto-rebuild graphify-out/ on code changes (debounced).
# Stop: Ctrl+C. Run from repo: powershell -File scripts/graphify-watch.ps1
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
Write-Host "[graphify] Watching $root — Ctrl+C to stop" -ForegroundColor Cyan
python -c "from pathlib import Path; from graphify.watch import watch; watch(Path('.'), debounce=2.0)"
