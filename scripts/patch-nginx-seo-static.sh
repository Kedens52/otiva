#!/usr/bin/env bash
# Вставляет SEO static locations в nginx vhost (перед первым location /).
# Certbot часто ставит listen 443 после location / — поэтому не привязываемся к listen.

set -euo pipefail

VHOST="${1:-/etc/nginx/sites-enabled/otiva}"
PROJECT="${OTIVA_ROOT:-/root/OTIVA}"
MARKER="# OTIVA SEO static (robots.txt trailing slash fix)"

if [[ ! -f "$VHOST" ]]; then
  echo "Vhost not found: $VHOST" >&2
  exit 1
fi

if [[ ! -f "${PROJECT}/public/robots.txt" ]]; then
  echo "WARN: ${PROJECT}/public/robots.txt missing — syncing"
  (cd "$PROJECT" && npm run sync:robots) 2>/dev/null || true
fi

if grep -qF "$MARKER" "$VHOST"; then
  echo "nginx SEO static: already patched ($VHOST)"
else
  INSERT_FILE=$(mktemp)
  cat > "$INSERT_FILE" <<EOF
    ${MARKER}
    location = /robots.txt {
        alias ${PROJECT}/public/robots.txt;
        default_type text/plain;
        add_header Cache-Control "public, max-age=0";
    }

    location = /robots.txt/ {
        alias ${PROJECT}/public/robots.txt;
        default_type text/plain;
        add_header Cache-Control "public, max-age=0";
    }

    location = /favicon.ico {
        alias ${PROJECT}/public/favicon.ico;
        expires 7d;
    }

    location = /favicon.ico/ {
        alias ${PROJECT}/public/favicon.ico;
        expires 7d;
    }

EOF

  TMP=$(mktemp)
  awk -v insert_file="$INSERT_FILE" '
    BEGIN { while ((getline line < insert_file) > 0) block = block line "\n" }
    !done && /^[[:space:]]*location[[:space:]]+\// {
      printf "%s", block
      done = 1
    }
    { print }
  ' "$VHOST" > "$TMP"
  rm -f "$INSERT_FILE"

  if ! grep -qF "$MARKER" "$TMP"; then
    echo "Failed to patch $VHOST (no location / found)" >&2
    grep -nE 'listen |location |proxy_pass|server \{' "$VHOST" >&2 || true
    rm -f "$TMP"
    exit 1
  fi

  cp -a "$VHOST" "${VHOST}.bak.$(date +%Y%m%d%H%M%S)"
  mv "$TMP" "$VHOST"
  echo "nginx SEO static: patched $VHOST"
fi

nginx -t
systemctl reload nginx

echo "--- curl /robots.txt/ ---"
HEADERS=$(curl -sI "https://nashlo.ru/robots.txt/" | tr -d '\r')
echo "$HEADERS" | head -6
if echo "$HEADERS" | grep -qE '^HTTP/[0-9.]+ 200'; then
  echo "OK robots.txt/ -> 200"
elif echo "$HEADERS" | grep -qE '^HTTP/[0-9.]+ 308'; then
  echo "FAIL robots.txt/ still 308" >&2
  exit 1
fi
