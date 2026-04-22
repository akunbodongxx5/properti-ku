# Ambil SHA-256 sidik jari penandatanganan dari APK (untuk isi assetlinks.json).
# Perlu JDK: keytool ada di PATH.
# Usage: pwsh -File scripts/extract-signing-from-apk.ps1 -ApkPath "C:\path\app-release.apk"

param(
  [Parameter(Mandatory)][string]$ApkPath
)

if (-not (Test-Path -LiteralPath $ApkPath)) {
  Write-Error "File tidak ada: $ApkPath"
  exit 1
}

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
  Write-Error "keytool tidak ditemukan. Install JDK (Temurin/Oracle) dan tambahkan ke PATH."
  exit 1
}

Write-Host "keytool -printcert -jarfile `"$ApkPath`"`n" -ForegroundColor Cyan
$out = & keytool -printcert -jarfile $ApkPath 2>&1 | Out-String

if ($LASTEXITCODE -ne 0 -and $out -notmatch 'SHA256') {
  Write-Error "keytool gagal: $out"
  exit 1
}

Write-Host $out

$m = [regex]::Match($out, 'SHA256:\s*([0-9A-Fa-f:]+)')
if (-not $m.Success) {
  Write-Warning "Tidak bisa parse SHA256 dari output — salin manual baris SHA256 dari atas."
  exit 2
}

$fingerprint = ($m.Groups[1].Value.Trim() -replace '\s', '').ToUpperInvariant()
Write-Host "`nFingerprint untuk assetlinks.json (salin persis dengan titik dua):" -ForegroundColor Green
Write-Host $m.Groups[1].Value.Trim()
