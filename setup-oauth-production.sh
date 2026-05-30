#!/usr/bin/env bash
# Обновляет Yandex + VK OAuth в .env на этом сервере (Linux).
# Запуск из каталога проекта:
#   chmod +x setup-oauth-production.sh
#   ./setup-oauth-production.sh 'ВАШ_VK_CLIENT_SECRET'
#
# Или без аргумента (VK secret нужно добавить вручную в .env):
#   ./setup-oauth-production.sh

set -euo pipefail

VK_CLIENT_SECRET="${1:-}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")" && pwd)}"
SITE_URL="https://nashlo.ru"
YANDEX_CLIENT_ID="9f0ea463eae349df8d23323f494ce4bb"
YANDEX_CLIENT_SECRET="5110f35d8e894afda56bb9ef5f7f142d"
YANDEX_REDIRECT_URI="https://nashlo.ru/api/auth/yandex/callback"
VK_CLIENT_ID="54574778"
VK_REDIRECT_URI="https://nashlo.ru/api/auth/vk/callback"

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "Файл .env не найден в $APP_DIR"
  exit 1
fi

KEYS=(
  SITE_URL APP_URL NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_APP_URL NEXT_PUBLIC_BASE_URL
  YANDEX_CLIENT_ID YANDEX_CLIENT_SECRET YANDEX_REDIRECT_URI
  VK_CLIENT_ID NEXT_PUBLIC_VK_APP_ID VK_CLIENT_SECRET VK_REDIRECT_URI NEXT_PUBLIC_VK_REDIRECT_URI
)

for key in "${KEYS[@]}"; do
  sed -i "/^${key}=/d" .env
done

{
  echo "SITE_URL=\"$SITE_URL\""
  echo "APP_URL=\"$SITE_URL\""
  echo "NEXT_PUBLIC_SITE_URL=\"$SITE_URL\""
  echo "NEXT_PUBLIC_APP_URL=\"$SITE_URL\""
  echo "NEXT_PUBLIC_BASE_URL=\"$SITE_URL\""
  echo "YANDEX_CLIENT_ID=\"$YANDEX_CLIENT_ID\""
  echo "YANDEX_CLIENT_SECRET=\"$YANDEX_CLIENT_SECRET\""
  echo "YANDEX_REDIRECT_URI=\"$YANDEX_REDIRECT_URI\""
  echo "VK_CLIENT_ID=\"$VK_CLIENT_ID\""
  echo "NEXT_PUBLIC_VK_APP_ID=\"$VK_CLIENT_ID\""
  echo "VK_REDIRECT_URI=\"$VK_REDIRECT_URI\""
  echo "NEXT_PUBLIC_VK_REDIRECT_URI=\"$VK_REDIRECT_URI\""
  if [[ -n "$VK_CLIENT_SECRET" ]]; then
    echo "VK_CLIENT_SECRET=\"$VK_CLIENT_SECRET\""
  fi
} >> .env

echo "--- OAuth env (без секретов) ---"
grep -E '^(SITE_URL|APP_URL|NEXT_PUBLIC_SITE_URL|YANDEX_CLIENT_ID|YANDEX_REDIRECT_URI|VK_CLIENT_ID|VK_REDIRECT_URI|NEXT_PUBLIC_VK)' .env || true
if grep -q '^VK_CLIENT_SECRET=' .env; then
  echo "VK_CLIENT_SECRET=[установлен]"
else
  echo "VK_CLIENT_SECRET не задан — передайте аргументом: ./setup-oauth-production.sh 'ключ'"
fi

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart otiva --update-env || pm2 restart nashlo --update-env || pm2 restart all --update-env
  pm2 status
else
  echo "pm2 не найден — перезапустите приложение вручную"
fi

echo "Готово. Проверка: https://nashlo.ru/login"
