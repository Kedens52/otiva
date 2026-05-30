#!/bin/bash
# Восстановление сайта после 404 на /_next/static/chunks/* (нет CSS/JS)
# Запуск на сервере: cd /root/OTIVA && bash scripts/recover-production-build.sh
set -euo pipefail

cd /root/OTIVA

echo "=== 1. Проверка env ==="
node scripts/check-production-site-url.js

echo "=== 2. Prisma ==="
npx prisma generate
node scripts/recover-failed-migrations.js 2>/dev/null || true
npx prisma migrate deploy

echo "=== 3. Сборка (старый .next сохраняем до успеха) ==="
rm -rf .next.staging .next.broken
if [ -d .next ]; then
  cp -a .next .next.before-recover
fi

if ! npm run build; then
  echo "❌ Сборка не удалась. Откатываем .next"
  rm -rf .next
  if [ -d .next.before-recover ]; then
    mv .next.before-recover .next
  fi
  exit 1
fi

node scripts/verify-next-build.js
rm -rf .next.before-recover

echo "=== 4. Перезапуск PM2 ==="
pm2 restart otiva --update-env

echo "=== 5. Проверка чанков ==="
BUILD_ID="$(cat .next/BUILD_ID)"
CHUNK="$(ls .next/static/chunks/webpack-*.js 2>/dev/null | head -1)"
if [ -z "$CHUNK" ]; then
  echo "❌ webpack chunk не найден"
  exit 1
fi
CHUNK_NAME="$(basename "$CHUNK")"
echo "BUILD_ID=$BUILD_ID"
echo "Проверяем https://nashlo.ru/_next/static/chunks/$CHUNK_NAME"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "https://nashlo.ru/_next/static/chunks/$CHUNK_NAME"

echo "✅ Готово. Обновите страницу с Ctrl+Shift+R (жёсткое обновление)."
