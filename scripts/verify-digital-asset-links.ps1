# Verifikasi hosting Digital Asset Links untuk TWA.
# Usage: powershell -File scripts/verify-digital-asset-links.ps1

param(
  [string] $ProjectBaseUrl = 'https://akunbodongxx5.github.io/properti-ku',
  [string] $HostRoot = 'https://akunbodongxx5.github.io'
)

$ErrorActionPreference = 'Stop'

function Get-JsonFromUrl([string]$Url) {
  try {
    $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -Method Get
    return @{ Ok = $true; Code = $resp.StatusCode; Text = $resp.Content }
  }
  catch {
    return @{ Ok = $false; Code = $null; Text = $null; Error = $_.Exception.Message }
  }
}

function Show-AssetLinksPayload([string]$JsonText) {
  $data = $JsonText | ConvertFrom-Json
  $target = $data[0].target
  $pkg = $target.package_name
  $sha = $target.sha256_cert_fingerprints[0]
  $bad = ($pkg -match 'REPLACE') -or ($sha -match 'REPLACE')
  if ($bad) {
    Write-Host '    WARN: masih REPLACE_* — isi package_name dan SHA256 dari APK.' -ForegroundColor Yellow
    return
  }
  Write-Host ('    package_name: ' + $pkg) -ForegroundColor Gray
  $n = [Math]::Min(28, $sha.Length)
  Write-Host ('    sha256[0]: ' + $sha.Substring(0, $n) + '...') -ForegroundColor Gray
}

Write-Host '=== Digital Asset Links (TWA) check ===' -ForegroundColor Cyan

$projUrl = $ProjectBaseUrl + '/.well-known/assetlinks.json'
$rootUrl = $HostRoot + '/.well-known/assetlinks.json'

$p = Get-JsonFromUrl $projUrl
$r = Get-JsonFromUrl $rootUrl

Write-Host ''
Write-Host ('[1] Project site: ' + $projUrl)
if (-not $p.Ok) {
  Write-Host ('    FAIL: ' + $p.Error) -ForegroundColor Red
}
if ($p.Ok) {
  Write-Host ('    OK HTTP ' + $p.Code) -ForegroundColor Green
  try {
    Show-AssetLinksPayload $p.Text
  }
  catch {
    Write-Host ('    FAIL JSON: ' + $_) -ForegroundColor Red
  }
}

Write-Host ''
Write-Host ('[2] Host root: ' + $rootUrl)
if (-not $r.Ok) {
  Write-Host '    FAIL or 404 - root host .well-known sering dibutuhkan Chrome TWA.' -ForegroundColor Yellow
  Write-Host '    Lihat extras/github-user-pages-root/README.md' -ForegroundColor Yellow
}
if ($r.Ok) {
  Write-Host ('    OK HTTP ' + $r.Code) -ForegroundColor Green
}

Write-Host ''
Write-Host '[3] Selesai. Tanpa fingerprint benar + mirror di host root, bilah URL APK sering tetap ada.' -ForegroundColor Gray
