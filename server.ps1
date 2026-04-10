# Static file server for PropertiKu (PWA needs http://, not file://)
$preferredPort = 61036
if ($env:PORT -match '^\d+$') { $preferredPort = [int]$env:PORT }

$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.woff' = 'font/woff'
  '.woff2' = 'font/woff2'
}

$listener = $null
$port = $null
$lastError = $null

for ($i = 0; $i -lt 40; $i++) {
  $tryPort = $preferredPort + $i
  $l = $null
  try {
    $l = New-Object System.Net.HttpListener
    # localhost + IPv4 + IPv6 loopback (hindari gagal koneksi saat browser pakai ::1)
    $l.Prefixes.Add("http://localhost:$tryPort/")
    $l.Prefixes.Add("http://127.0.0.1:$tryPort/")
    try {
      $l.Prefixes.Add("http://[::1]:$tryPort/")
    } catch {
      # IPv6 tidak tersedia - abaikan
    }
    $l.Start()
    $listener = $l
    $port = $tryPort
    break
  } catch {
    $lastError = $_.Exception
    if ($l) { try { $l.Close() } catch {} }
  }
}

if (-not $listener) {
  Write-Host ""
  Write-Host "Gagal membuka server HTTP." -ForegroundColor Red
  Write-Host "Penyebab terakhir: $($lastError.Message)" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Coba salah satu:" -ForegroundColor Cyan
  Write-Host "  1) Double-click serve.bat dan biarkan jendela CMD tetap terbuka."
  Write-Host "  2) Tutup program lain yang memakai port $preferredPort (atau: set PORT=8080 di CMD lalu serve.bat)"
  Write-Host "  3) PowerShell sebagai Administrator, lalu jalankan:"
  Write-Host "     netsh http add urlacl url=http://localhost:$preferredPort/ user=$env:USERNAME"
  Write-Host "     netsh http add urlacl url=http://127.0.0.1:$preferredPort/ user=$env:USERNAME"
  Write-Host ""
  Read-Host "Tekan Enter untuk menutup"
  exit 1
}

if ($port -ne $preferredPort) {
  Write-Host "Catatan: port $preferredPort sibuk, memakai port $port" -ForegroundColor Yellow
}

Write-Host ""
Write-Host " PropertiKu - server aktif" -ForegroundColor Green
Write-Host "   http://localhost:$port/" -ForegroundColor White
Write-Host "   http://127.0.0.1:$port/" -ForegroundColor White
Write-Host ""
Write-Host "Biarkan jendela ini terbuka. Ctrl+C untuk berhenti." -ForegroundColor DarkGray
Write-Host ""

# Buka browser (bisa mati: set NO_BROWSER=1 sebelum jalankan)
if (-not $env:NO_BROWSER) {
  try { Start-Process "http://localhost:$port/" } catch {}
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    $path = $req.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }

    $rel = $path.TrimStart("/").Replace("/", [IO.Path]::DirectorySeparatorChar)
    $filePath = [IO.Path]::GetFullPath((Join-Path $root $rel))
    $rootFull = [IO.Path]::GetFullPath($root)
    if (-not $filePath.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403
      $bytes = [Text.Encoding]::UTF8.GetBytes('Forbidden')
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      $res.Close()
      continue
    }

    if (Test-Path -LiteralPath $filePath -PathType Leaf) {
      $ext = [IO.Path]::GetExtension($filePath).ToLowerInvariant()
      $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
      $res.ContentType = $contentType
      # Tanpa ini, browser/SW sering menyimpan CSS/JS lama — preview tablet terasa "ngadat".
      if ($ext -in '.html', '.css', '.js', '.json', '.webmanifest') {
        try {
          [void]$res.Headers.Add('Cache-Control', 'no-store, no-cache, must-revalidate')
        } catch {
          # Beberapa host .NET membatasi header ini — abaikan, server tetap jalan.
        }
      }
      $bytes = [IO.File]::ReadAllBytes($filePath)
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $bytes = [Text.Encoding]::UTF8.GetBytes('Not Found')
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $res.Close()
  }
} finally {
  try { $listener.Stop() } catch {}
  try { $listener.Close() } catch {}
}
