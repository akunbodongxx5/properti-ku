$port = if ($env:PORT -match '^\d+$') { [int]$env:PORT } else { 61036 }
$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

$mimeTypes = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"
  ".js"="application/javascript; charset=utf-8"; ".json"="application/json; charset=utf-8"
  ".png"="image/png"; ".jpg"="image/jpeg"; ".svg"="image/svg+xml"; ".ico"="image/x-icon"
  ".webmanifest"="application/manifest+json"; ".woff2"="font/woff2"
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
try { $listener.Start() } catch {
  Write-Host "Port $port busy, trying alternatives..." -ForegroundColor Yellow
  for ($i = 1; $i -lt 20; $i++) {
    $port = 61036 + $i
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
    try { $listener.Start(); break } catch { if ($i -eq 19) { throw } }
  }
}

Write-Host "PropertiKu server running on http://localhost:$port/" -ForegroundColor Green

while ($true) {
  $client = $listener.AcceptTcpClient()
  $stream = $client.GetStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $requestLine = $reader.ReadLine()
  # Read remaining headers
  while ($true) { $h = $reader.ReadLine(); if ([string]::IsNullOrEmpty($h)) { break } }

  $path = "/"
  if ($requestLine -match '^GET\s+(\S+)') { $path = $Matches[1] }
  $path = [System.Uri]::UnescapeDataString($path.Split('?')[0])
  if ($path -eq "/") { $path = "/index.html" }

  $rel = $path.TrimStart("/").Replace("/", [IO.Path]::DirectorySeparatorChar)
  $filePath = [IO.Path]::GetFullPath((Join-Path $root $rel))

  $statusLine = "HTTP/1.1 200 OK"
  $body = $null
  $contentType = "application/octet-stream"

  $cacheCtl = ""
  if (Test-Path -LiteralPath $filePath -PathType Leaf) {
    $ext = [IO.Path]::GetExtension($filePath).ToLowerInvariant()
    if ($mimeTypes.ContainsKey($ext)) { $contentType = $mimeTypes[$ext] }
    $body = [IO.File]::ReadAllBytes($filePath)
    if ($ext -in '.html', '.css', '.js', '.json', '.webmanifest') {
      $cacheCtl = "Cache-Control: no-store, no-cache, must-revalidate`r`n"
    }
  } else {
    $statusLine = "HTTP/1.1 404 Not Found"
    $contentType = "text/plain"
    $body = [Text.Encoding]::UTF8.GetBytes("Not Found")
  }

  $header = "$statusLine`r`nContent-Type: $contentType`r`n$cacheCtl" + "Content-Length: $($body.Length)`r`nConnection: close`r`nAccess-Control-Allow-Origin: *`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  $stream.Write($body, 0, $body.Length)
  $stream.Flush()
  $client.Close()
}
