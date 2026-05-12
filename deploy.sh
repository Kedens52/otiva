#!/bin/bash
# ============================================================
# OTIVA / Нашло — Deploy script
# Запускать из корня проекта: bash deploy.sh
# Если heredoc падает с «unexpected end of file» после CRLF: dos2unix deploy.sh
# ============================================================

SERVER="root@185.154.193.6"
REMOTE_PATH="/root/OTIVA"
LOCAL_PATH="$(cd "$(dirname "$0")" && pwd)"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=30"
# Same path on server after scp; local tarball lives under MSYS /tmp (Git Bash) or /tmp (Unix).
DEPLOY_ARCHIVE="/tmp/otiva_deploy.tar.gz"

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
    -czf "$DEPLOY_ARCHIVE" -C "$LOCAL_PATH" .

if [ $? -ne 0 ]; then
  echo "❌ Ошибка при упаковке файлов"
  exit 1
fi

echo "📤 Загружаем архив на сервер..."
# Git Bash: MSYS rewrites user:/tmp/... for Windows scp.exe; disable conversion and pass a Windows path for the local file.
DEPLOY_ARCHIVE_LOCAL="$DEPLOY_ARCHIVE"
if command -v cygpath >/dev/null 2>&1; then
  DEPLOY_ARCHIVE_LOCAL="$(cygpath -w "$DEPLOY_ARCHIVE")"
  MSYS2_ARG_CONV_EXCL='*' scp $SSH_OPTS "$DEPLOY_ARCHIVE_LOCAL" "$SERVER:$DEPLOY_ARCHIVE"
else
  scp $SSH_OPTS "$DEPLOY_ARCHIVE_LOCAL" "$SERVER:$DEPLOY_ARCHIVE"
fi

if [ $? -ne 0 ]; then
  echo "❌ Ошибка при загрузке файлов"
  exit 1
fi

echo ""
echo "✅ Файлы загружены"
echo ""

# 2. На сервере: создать папку, распаковать, установить, билдить, перезапустить
echo "🔧 Запускаем сборку на сервере..."
ssh $SSH_OPTS "$SERVER" << 'REMOTE'
  set -e

  echo ""
  echo "=== Создаём папку проекта (если не существует) ==="
  mkdir -p /root/OTIVA

  echo ""
  echo "=== Очищаем дерево проекта (кроме .env* и public/) — иначе tar оставляет удалённые файлы и ломает Next.js; public/ хранит uploads вне архива ==="
  find /root/OTIVA -mindepth 1 -maxdepth 1 ! -name ".env" ! -name ".env.local" ! -name ".env.production" ! -name "public" -exec rm -rf {} +

  echo ""
  echo "=== Распаковываем файлы ==="
  tar -xzf /tmp/otiva_deploy.tar.gz -C /root/OTIVA
  rm /tmp/otiva_deploy.tar.gz

  echo ""
  echo "=== Переходим в папку проекта ==="
  cd /root/OTIVA

  echo ""
  echo "=== npm install ==="
  npm install --legacy-peer-deps

  echo ""
  echo "=== Prisma: генерация клиента и применение миграций ==="
  npx prisma generate
  echo "Prisma: сброс записи об упавшей миграции 20260512140000_support_auto_replies (P3009), если есть"
  npx prisma migrate resolve --rolled-back "20260512140000_support_auto_replies" 2>/dev/null || true
  npx prisma migrate deploy

  echo ""
  echo "=== Seed categories ==="
  npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts 2>/dev/null || echo "(seed skipped)"

  echo ""
  echo "=== npm build ==="
  npm run build

  echo ""
  echo "=== Перезапуск PM2 ==="
  pm2 restart otiva --update-env 2>/dev/null || pm2 start npm --name otiva -- start

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
