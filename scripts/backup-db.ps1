# 数据库备份（Windows PowerShell）
param(
  [string]$BackupDir = "$PSScriptRoot\..\backups"
)

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outFile = Join-Path $BackupDir "pg_$stamp.sql"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$envFile = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
  }
}

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
  $dbUrl = "postgresql://postgres:postgres@localhost:5432/ai_commerce_studio?schema=public"
}

Write-Host "[backup] dumping to $outFile"
& pg_dump $dbUrl | Set-Content -Encoding utf8 $outFile
Write-Host "[backup] done"
