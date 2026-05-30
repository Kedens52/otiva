#!/usr/bin/env bash
# Сливает deploy/seo.production.env в .env (IndexNow и др.).
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
SEO_FILE="${SEO_FILE:-$APP_DIR/deploy/seo.production.env}"

cd "$APP_DIR"

if [[ ! -f "$SEO_FILE" ]]; then
  echo "=== SEO env: пропуск (нет $SEO_FILE) ==="
  exit 0
fi

if [[ ! -f .env ]]; then
  touch .env
fi

set -a
# shellcheck disable=SC1090
source "$SEO_FILE"
set +a

for key in INDEXNOW_KEY; do
  val="${!key:-}"
  if [[ -z "$val" ]]; then
    continue
  fi
  sed -i "/^${key}=/d" .env
  printf '%s="%s"\n' "$key" "$val" >> .env
done

echo "=== SEO env применён из deploy/seo.production.env ==="
grep -E '^INDEXNOW_KEY=' .env || true
