$ErrorActionPreference = "Stop"

$Port = 3013
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BaseUrl = "http://localhost:$Port"
$StartedProcess = $null

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
    # Start-Process (not Start-Job): Stop-Job does not kill the child node
    # process on Windows, which leaks a dev server on the port after the run.
    $StartedProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" `
      -WorkingDirectory $RepoRoot.Path -WindowStyle Hidden -PassThru

    $deadline = (Get-Date).AddSeconds(90)
    while ((Get-Date) -lt $deadline) {
      if (Test-DevServerReady) {
        break
      }
      Start-Sleep -Milliseconds 500
    }

    if (-not (Test-DevServerReady)) {
      throw "Dev server did not become ready on $BaseUrl."
    }
  } else {
    Write-Host "Reusing existing dev server on $BaseUrl."
  }

  $env:PLAYWRIGHT_SKIP_WEB_SERVER = "1"
  & npx.cmd playwright test
  exit $LASTEXITCODE
} finally {
  if ($null -ne $StartedProcess) {
    # /T kills the whole tree (npm.cmd -> node next dev -> start-server child).
    & taskkill /PID $StartedProcess.Id /T /F | Out-Null
  }
}
