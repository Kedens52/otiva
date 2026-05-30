#!/usr/bin/env bash
# Полный цикл деплоя на сервере (deploy.sh / deploy.ps1).
set -euo pipefail

REMOTE_PATH="${REMOTE_PATH:-/root/OTIVA}"
ARCHIVE="${DEPLOY_ARCHIVE:-/tmp/otiva_deploy.tar.gz}"

echo ""
echo "=== Create project dir ==="
mkdir -p "$REMOTE_PATH"

echo ""
echo "=== Clean tree (keep .env, node_modules, .next, public, prisma) ==="
find "$REMOTE_PATH" -mindepth 1 -maxdepth 1 \
  ! -name ".env" \
  ! -name ".env.local" \
  ! -name ".env.production" \
  ! -name "node_modules" \
  ! -name ".next" \
  ! -name "public" \
  ! -name "prisma" \
  ! -name "deploy" \
  -exec rm -rf {} +

mkdir -p "$REMOTE_PATH/public/uploads"
find "$REMOTE_PATH/public" -mindepth 1 -maxdepth 1 ! -name "uploads" ! -name "badges" -exec rm -rf {} + 2>/dev/null || true

mkdir -p "$REMOTE_PATH/prisma/migrations"
find "$REMOTE_PATH/prisma" -mindepth 1 -maxdepth 1 ! -name "migrations" -exec rm -rf {} + 2>/dev/null || true

echo ""
echo "=== Extract archive ==="
tar -xzf "$ARCHIVE" -C "$REMOTE_PATH"
rm -f "$ARCHIVE"

cd "$REMOTE_PATH"

echo ""
echo "=== npm install ==="
npm install --legacy-peer-deps

echo ""
echo "=== Check production SITE_URL ==="
node scripts/check-production-site-url.js

echo ""
echo "=== OAuth env ==="
chmod +x scripts/apply-production-oauth-env.sh 2>/dev/null || true
bash scripts/apply-production-oauth-env.sh

echo ""
echo "=== SEO env (IndexNow) ==="
chmod +x scripts/apply-production-seo-env.sh 2>/dev/null || true
bash scripts/apply-production-seo-env.sh

echo ""
echo "=== Prisma ==="
npx prisma generate
node scripts/recover-failed-migrations.js
npx prisma migrate deploy

echo ""
echo "=== npm build (.next.staging) ==="
rm -rf .next.staging
if [ -d .next ]; then
  rm -rf .next.deploy-backup
  cp -a .next .next.deploy-backup
fi
if ! NEXT_DIST_DIR=.next.staging npm run build; then
  echo "npm run build failed — keeping previous .next"
  rm -rf .next.staging
  exit 1
fi
node scripts/verify-next-build.js .next.staging
rm -rf .next
mv .next.staging .next
rm -rf .next.deploy-backup

echo ""
echo "=== PM2 restart ==="
if ! pm2 restart otiva --update-env 2>/dev/null; then
  pm2 start npm --name otiva -- start
  pm2 save
fi

echo "Waiting for app to listen..."
sleep 8

echo ""
echo "=== nginx robots.txt/ fix ==="
chmod +x scripts/patch-nginx-seo-static.sh 2>/dev/null || true
if ! bash scripts/patch-nginx-seo-static.sh /etc/nginx/sites-enabled/otiva; then
  echo "WARN: nginx patch failed — see deploy/nginx-seo-static.conf"
fi

echo ""
echo "=== SEO check ==="
if ! npm run check:seo:prod; then
  echo "WARN: SEO check failed (retry in 30s after cold start)"
  sleep 30
  npm run check:seo:prod || echo "WARN: SEO check still failing — site may need manual check"
fi

echo ""
echo "=== PM2 status ==="
pm2 list

echo ""
echo "Deploy finished OK"
