$SERVER = "root@185.154.193.6"
$ARCHIVE = "$env:TEMP\otiva_deploy.tar.gz"
$REMOTE_SCRIPT_LOCAL = Join-Path $env:TEMP "nashlo-deploy-remote.sh"
$DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$REMOTE_SCRIPT = Join-Path $DIR "scripts\deploy-remote.sh"

Write-Host "=== Nashlo Deploy ===" -ForegroundColor Cyan

$OAuthEnvFile = Join-Path $DIR "deploy\oauth.production.env"
if (-not (Test-Path $OAuthEnvFile)) {
    Write-Host "WARN: deploy/oauth.production.env not found - OAuth will not be updated on server." -ForegroundColor Yellow
}

if (-not (Test-Path $REMOTE_SCRIPT)) {
    Write-Host "ERROR: scripts/deploy-remote.sh not found" -ForegroundColor Red
    exit 1
}

Write-Host "Packing files..." -ForegroundColor Yellow
$excludes = @(
    "--exclude=.next",
    "--exclude=node_modules",
    "--exclude=.git",
    "--exclude=public/uploads",
    "--exclude=.env",
    "--exclude=.env.local",
    "--exclude=.env.production",
    "--exclude=deploy.ps1",
    "--exclude=setup-server-env.ps1",
    "--exclude=deploy.sh"
)
$tarArgs = $excludes + @("-czf", $ARCHIVE, "-C", $DIR, ".")
& tar @tarArgs
if ($LASTEXITCODE -ne 0) { Write-Host "Archive error" -ForegroundColor Red; exit 1 }

Write-Host "Uploading to server..." -ForegroundColor Yellow
& scp -o StrictHostKeyChecking=accept-new $ARCHIVE "${SERVER}:/tmp/otiva_deploy.tar.gz"
if ($LASTEXITCODE -ne 0) { Write-Host "Upload error" -ForegroundColor Red; exit 1 }

if (Test-Path $OAuthEnvFile) {
    & ssh -o StrictHostKeyChecking=accept-new $SERVER "mkdir -p /root/OTIVA/deploy"
    & scp -o StrictHostKeyChecking=accept-new $OAuthEnvFile "${SERVER}:/root/OTIVA/deploy/oauth.production.env"
}

# LF-only script via scp (pipe from PowerShell adds CRLF -> bash errors)
$remoteScript = (Get-Content -Raw -Encoding UTF8 $REMOTE_SCRIPT) -replace "`r`n", "`n" -replace "`r", "`n"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($REMOTE_SCRIPT_LOCAL, $remoteScript, $utf8NoBom)

Write-Host "Building on server..." -ForegroundColor Yellow
& scp -o StrictHostKeyChecking=accept-new $REMOTE_SCRIPT_LOCAL "${SERVER}:/tmp/deploy-remote.sh"
& ssh -o StrictHostKeyChecking=accept-new $SERVER "sed -i 's/\r$//' /tmp/deploy-remote.sh && chmod +x /tmp/deploy-remote.sh && bash /tmp/deploy-remote.sh"
if ($LASTEXITCODE -ne 0) { Write-Host "Build error" -ForegroundColor Red; exit 1 }

Write-Host "=== Done! ===" -ForegroundColor Green
