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
OAUTH_ENV_FILE="$LOCAL_PATH/deploy/oauth.production.env"
if [ ! -f "$OAUTH_ENV_FILE" ]; then
  echo "⚠️  deploy/oauth.production.env не найден — OAuth на сервере не обновится."
  echo "    Скопируйте: cp deploy/oauth.production.env.example deploy/oauth.production.env"
  echo ""
fi

echo "📦 Упаковываем файлы..."
tar --exclude=".next" \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="public/uploads" \
    --exclude=".env" \
    --exclude=".env.local" \
    --exclude=".env.production" \
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

if [ -f "$OAUTH_ENV_FILE" ]; then
  echo "🔐 Загружаем OAuth env..."
  ssh $SSH_OPTS "$SERVER" "mkdir -p $REMOTE_PATH/deploy"
  if command -v cygpath >/dev/null 2>&1; then
    OAUTH_ENV_SCP="$(cygpath -w "$OAUTH_ENV_FILE")"
    MSYS2_ARG_CONV_EXCL='*' scp $SSH_OPTS "$OAUTH_ENV_SCP" "$SERVER:$REMOTE_PATH/deploy/oauth.production.env"
  else
    scp $SSH_OPTS "$OAUTH_ENV_FILE" "$SERVER:$REMOTE_PATH/deploy/oauth.production.env"
  fi
  echo "✅ OAuth env на сервере"
  echo ""
fi

# 2. На сервере: распаковка, сборка, nginx, SEO check
echo "🔧 Запускаем сборку на сервере..."
ssh $SSH_OPTS "$SERVER" "bash -s" < "$LOCAL_PATH/scripts/deploy-remote.sh"

if [ $? -ne 0 ]; then
  echo "❌ Ошибка при сборке на сервере"
  exit 1
fi

echo ""
echo "🎉 Всё готово! Сайт обновлён."
