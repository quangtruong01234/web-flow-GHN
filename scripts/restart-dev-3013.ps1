$ErrorActionPreference = "Stop"

$Port = 3013
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Write-Host "Checking port $Port..."
$listeners = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
$processIds = @($listeners | Select-Object -ExpandProperty OwningProcess -Unique)

foreach ($processId in $processIds) {
  if (-not $processId) {
    continue
  }

  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if ($null -eq $process) {
    continue
  }

  Write-Host "Stopping process $processId ($($process.ProcessName)) on port $Port..."
  Stop-Process -Id $processId -Force
}

if ($processIds.Count -gt 0) {
  Start-Sleep -Seconds 2
}

$remaining = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
if ($remaining.Count -gt 0) {
  $remainingIds = ($remaining | Select-Object -ExpandProperty OwningProcess -Unique) -join ", "
  throw "Port $Port is still occupied by process id(s): $remainingIds"
}

Set-Location $RepoRoot
Write-Host "Starting Next.js dev server on http://localhost:$Port..."
& npm.cmd run dev
exit $LASTEXITCODE
