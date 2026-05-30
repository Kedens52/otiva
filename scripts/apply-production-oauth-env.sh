#!/usr/bin/env bash
# Сливает deploy/oauth.production.env в .env (вызывается из deploy.sh на сервере).
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
OAUTH_FILE="${OAUTH_FILE:-$APP_DIR/deploy/oauth.production.env}"

cd "$APP_DIR"

if [[ ! -f "$OAUTH_FILE" ]]; then
  echo "=== OAuth env: пропуск (нет $OAUTH_FILE) ==="
  exit 0
fi

if [[ ! -f .env ]]; then
  echo "=== OAuth env: создаём .env ==="
  touch .env
fi

# shellcheck disable=SC1090
set -a
source "$OAUTH_FILE"
set +a

KEYS=(
  SITE_URL APP_URL NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_APP_URL NEXT_PUBLIC_BASE_URL
  YANDEX_CLIENT_ID YANDEX_CLIENT_SECRET YANDEX_REDIRECT_URI
  VK_CLIENT_ID NEXT_PUBLIC_VK_APP_ID VK_CLIENT_SECRET VK_REDIRECT_URI NEXT_PUBLIC_VK_REDIRECT_URI
)

for key in "${KEYS[@]}"; do
  val="${!key:-}"
  if [[ -z "$val" ]]; then
    continue
  fi
  sed -i "/^${key}=/d" .env
  printf '%s="%s"\n' "$key" "$val" >> .env
done

echo "=== OAuth env применён из deploy/oauth.production.env ==="
grep -E '^(SITE_URL|YANDEX_CLIENT_ID|YANDEX_REDIRECT_URI|VK_CLIENT_ID|VK_REDIRECT_URI|NEXT_PUBLIC_VK_APP_ID)=' .env || true
if grep -q '^VK_CLIENT_SECRET=' .env; then echo "VK_CLIENT_SECRET=[ok]"; fi
if grep -q '^YANDEX_CLIENT_SECRET=' .env; then echo "YANDEX_CLIENT_SECRET=[ok]"; fi
