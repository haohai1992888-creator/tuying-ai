#Requires -Version 5.1
param(
  [string]$ApiUrl = "http://localhost:3001/api/health"
)

Write-Host "[healthcheck] probing $ApiUrl"

try {
  $resp = Invoke-RestMethod -Uri $ApiUrl -Method Get -TimeoutSec 10
  if ($resp.success -eq $true) {
    Write-Host "[healthcheck] OK"
    $resp | ConvertTo-Json -Depth 5
    exit 0
  }
  Write-Host "[healthcheck] FAIL — unhealthy"
  $resp | ConvertTo-Json -Depth 5
  exit 1
} catch {
  Write-Host "[healthcheck] FAIL — $($_.Exception.Message)"
  exit 1
}
