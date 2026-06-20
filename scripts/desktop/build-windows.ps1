# Windows x64 NSIS build — output: download/windows/AI-Commerce-Setup.exe
# Requires: Rust, Visual Studio Build Tools
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location (Join-Path $Root "apps\desktop")

function Invoke-PackageBuild {
  param([string]$Script)
  if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm run $Script
  } else {
    npm run $Script
  }
}

Write-Host "Building AI Commerce Desktop (Windows x64)..." -ForegroundColor Cyan
Invoke-PackageBuild "build"
Invoke-PackageBuild "tauri:build"

$NsisDir = Join-Path $Root "apps\desktop\src-tauri\target\release\bundle\nsis"
$OutDir = Join-Path $Root "download\windows"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$Setup = Get-ChildItem -Path $NsisDir -Filter "AI-Commerce-Setup*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $Setup) {
  $Setup = Get-ChildItem -Path $NsisDir -Filter "*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
}

if ($Setup) {
  Copy-Item $Setup.FullName (Join-Path $OutDir "AI-Commerce-Setup.exe") -Force
  Write-Host "Output: download\windows\AI-Commerce-Setup.exe" -ForegroundColor Green
} else {
  Write-Host "No NSIS installer found under $NsisDir" -ForegroundColor Red
  exit 1
}
