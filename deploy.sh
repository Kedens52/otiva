#!/bin/bash
# ============================================================
# OTIVA / Нашло — Deploy script
# Запускать из корня проекта: bash deploy.sh
# ============================================================

SERVER="root@185.154.193.6"
REMOTE_PATH="/root/OTIVA"
LOCAL_PATH="$(cd "$(dirname "$0")" && pwd)"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=30"

echo "🚀 Начинаем деплой на $SERVER:$REMOTE_PATH"
echo ""

# 1. Упаковываем и загружаем файлы (исключаем node_modules, .next, uploads)
echo "📦 Упаковываем файлы..."
tar --exclude=".next" \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="public/uploads" \
    --exclude=".env" \
    --exclude=".env.local" \
    --exclude="deploy.sh" \
    -czf /tmp/otiva_deploy.tar.gz -C "$LOCAL_PATH" .

if [ $? -ne 0 ]; then
  echo "❌ Ошибка при упаковке файлов"
  exit 1
fi

echo "📤 Загружаем архив на сервер..."
scp $SSH_OPTS /tmp/otiva_deploy.tar.gz "$SERVER:/tmp/otiva_deploy.tar.gz"

if [ $? -ne 0 ]; then
  echo "❌ Ошибка при загрузке файлов"
  exit 1
fi

echo ""
echo "✅ Файлы загружены"
echo ""

# 2. На сервере: установить зависимости, мигрировать БД, билдить, перезапустить
echo "🔧 Запускаем сборку на сервере..."
ssh $SSH_OPTS "$SERVER" << 'REMOTE'
  set -e
  cd /root/OTIVA

  echo ""
  echo "=== Распаковываем файлы ==="
  tar -xzf /tmp/otiva_deploy.tar.gz -C /root/OTIVA
  rm /tmp/otiva_deploy.tar.gz

  echo ""
  echo "=== npm install ==="
  npm install --legacy-peer-deps

  echo ""
  echo "=== Prisma db push (sync schema → DB) ==="
  npx prisma db push --accept-data-loss

  echo ""
  echo "=== Seed categories ==="
  npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts 2>/dev/null || echo "(seed skipped)"

  echo ""
  echo "=== npm build (includes prisma generate) ==="
  npm run build

  echo ""
  echo "=== Перезапуск PM2 ==="
  pm2 restart otiva --update-env

  echo ""
  echo "=== Статус ==="
  pm2 status

  echo ""
  echo "✅ Деплой завершён успешно!"
REMOTE

if [ $? -ne 0 ]; then
  echo "❌ Ошибка при сборке на сервере"
  exit 1
fi

echo ""
echo "🎉 Всё готово! Сайт обновлён."
