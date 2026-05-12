$SERVER = "root@185.154.193.6"
$ARCHIVE = "$env:TEMP\otiva_deploy.tar.gz"
$DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== Nashlo Deploy ===" -ForegroundColor Cyan

# Step 1: Create archive
Write-Host "Packing files..." -ForegroundColor Yellow
$excludes = @(
    "--exclude=.next",
    "--exclude=node_modules",
    "--exclude=.git",
    "--exclude=public/uploads",
    "--exclude=.env",
    "--exclude=.env.local",
    "--exclude=deploy.ps1",
    "--exclude=setup-server-env.ps1",
    "--exclude=deploy.sh"
)
$tarArgs = $excludes + @("-czf", $ARCHIVE, "-C", $DIR, ".")
& tar @tarArgs
if ($LASTEXITCODE -ne 0) { Write-Host "Archive error" -ForegroundColor Red; exit 1 }
Write-Host "Archive ready" -ForegroundColor Green

# Step 2: Upload
Write-Host "Uploading to server..." -ForegroundColor Yellow
& scp -o StrictHostKeyChecking=accept-new $ARCHIVE "${SERVER}:/tmp/otiva_deploy.tar.gz"
if ($LASTEXITCODE -ne 0) { Write-Host "Upload error" -ForegroundColor Red; exit 1 }
Write-Host "Uploaded" -ForegroundColor Green

# Step 3: Build on server
Write-Host "Building on server..." -ForegroundColor Yellow
$cmd = 'set -e; mkdir -p /root/OTIVA; tar -xzf /tmp/otiva_deploy.tar.gz -C /root/OTIVA; rm /tmp/otiva_deploy.tar.gz; cd /root/OTIVA; npm install --legacy-peer-deps --silent; npx prisma generate; npx prisma migrate deploy; npm run build; pm2 restart otiva --update-env 2>/dev/null || pm2 start npm --name otiva -- start; pm2 status'
& ssh -o StrictHostKeyChecking=accept-new $SERVER $cmd
if ($LASTEXITCODE -ne 0) { Write-Host "Build error" -ForegroundColor Red; exit 1 }

Write-Host "=== Done! ===" -ForegroundColor Green
