$ErrorActionPreference = "Stop"

$Port = 3013
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BaseUrl = "http://localhost:$Port"
$StartedJob = $null

function Test-DevServerReady {
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/login" -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

Set-Location $RepoRoot

try {
  if (-not (Test-DevServerReady)) {
    Write-Host "Starting temporary Next.js dev server on $BaseUrl..."
    $StartedJob = Start-Job -ScriptBlock {
      param($workdir)
      Set-Location -LiteralPath $workdir
      & npm.cmd run dev
    } -ArgumentList $RepoRoot.Path

    $deadline = (Get-Date).AddSeconds(90)
    while ((Get-Date) -lt $deadline) {
      if (Test-DevServerReady) {
        break
      }
      Start-Sleep -Milliseconds 500
    }

    if (-not (Test-DevServerReady)) {
      Receive-Job -Job $StartedJob -Keep
      throw "Dev server did not become ready on $BaseUrl."
    }
  } else {
    Write-Host "Reusing existing dev server on $BaseUrl."
  }

  $env:PLAYWRIGHT_SKIP_WEB_SERVER = "1"
  & npx.cmd playwright test
  exit $LASTEXITCODE
} finally {
  if ($null -ne $StartedJob) {
    Stop-Job -Job $StartedJob -ErrorAction SilentlyContinue
    Remove-Job -Job $StartedJob -Force -ErrorAction SilentlyContinue
  }
}
