<#
.SYNOPSIS
    Automated MongoDB Backup Script for Windows / PowerShell.
.DESCRIPTION
    Dumps MongoDB database using either Docker container or local mongodump,
    gzips the archive, and rotates old backups.
.PARAMETER BackupDir
    Destination folder for backups (default: .\backups\mongo)
.PARAMETER RetentionDays
    Number of days to keep backups (default: 14)
#>

[CmdletBinding()]
param(
    [string]$BackupDir = ".\backups\mongo",
    [int]$RetentionDays = 14,
    [string]$ContainerName = "webfashion-mongo-prod",
    [string]$DbName = "webfashion",
    [string]$DbUser = "webfashion_admin",
    [string]$DbPass = "webfashion_prod_pass"
)

$ErrorActionPreference = "Stop"

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFileName = "webfashion_db_$Timestamp.archive.gz"

if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$BackupPath = Join-Path -Path $BackupDir -ChildPath $BackupFileName

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting MongoDB Backup at $(Get-Date)" -ForegroundColor Cyan
Write-Host " Database: $DbName" -ForegroundColor Cyan
Write-Host " Destination: $BackupPath" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if Docker container is running
$DockerRunning = $false
try {
    $Containers = docker ps --format "{{.Names}}" 2>$null
    if ($Containers -match "^$ContainerName$") {
        $DockerRunning = $true
    }
} catch {
    $DockerRunning = $false
}

if ($DockerRunning) {
    Write-Host "Dumping from Docker container '$ContainerName'..." -ForegroundColor Green
    docker exec $ContainerName mongodump `
        --username=$DbUser `
        --password=$DbPass `
        --authenticationDatabase=admin `
        --db=$DbName `
        --archive --gzip > $BackupPath
} else {
    Write-Host "Docker container not detected. Attempting local mongodump..." -ForegroundColor Yellow
    $MongoUri = if ($env:MONGO_CONNECTIONSTRING) { $env:MONGO_CONNECTIONSTRING } else { "mongodb://127.0.0.1:27017/$DbName" }
    & mongodump --uri="$MongoUri" --archive="$BackupPath" --gzip
}

if ((Test-Path -Path $BackupPath) -and ((Get-Item $BackupPath).Length -gt 0)) {
    $SizeMB = [math]::Round(((Get-Item $BackupPath).Length / 1MB), 2)
    Write-Host " Backup created successfully: $BackupPath ($SizeMB MB)" -ForegroundColor Green
    
    $Hash = (Get-FileHash -Path $BackupPath -Algorithm SHA256).Hash
    Set-Content -Path "$BackupPath.sha256" -Value "$Hash  $BackupFileName"
    Write-Host " SHA256 Hash: $Hash" -ForegroundColor DarkGray
} else {
    Write-Error "Backup failed or generated empty archive."
    exit 1
}

# Cleanup retention
Write-Host "Purging backups older than $RetentionDays days..." -ForegroundColor Gray
$Cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "webfashion_db_*.archive.gz*" | Where-Object { $_.LastWriteTime -lt $Cutoff } | Remove-Item -Force -Verbose

Write-Host "MongoDB Backup Finished at $(Get-Date)" -ForegroundColor Cyan
