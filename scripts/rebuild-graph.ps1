# Rebuild Graphify graph into graphify-out/. Run from repo: powershell -File scripts/rebuild-graph.ps1
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
