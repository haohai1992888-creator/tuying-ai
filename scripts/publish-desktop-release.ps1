# Legacy wrapper — use npm run release:desktop
param(
  [string]$Version = "1.0.0"
)

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
npx tsx scripts/desktop/publish-release.ts --version $Version @args
