# Обновляет Yandex OAuth и канонические URL на production-сервере.
# Запуск: .\setup-yandex-production.ps1

$SERVER = "root@185.154.193.6"

$YANDEX_CLIENT_ID = "9f0ea463eae349df8d23323f494ce4bb"
$YANDEX_CLIENT_SECRET = "5110f35d8e894afda56bb9ef5f7f142d"
$YANDEX_REDIRECT_URI = "https://nashlo.ru/api/auth/yandex/callback"
$SITE_URL = "https://nashlo.ru"

Write-Host "Updating Yandex OAuth env on server..." -ForegroundColor Yellow

$lines = @(
  "SITE_URL=`"$SITE_URL`"",
  "APP_URL=`"$SITE_URL`"",
  "NEXT_PUBLIC_SITE_URL=`"$SITE_URL`"",
  "NEXT_PUBLIC_APP_URL=`"$SITE_URL`"",
  "NEXT_PUBLIC_BASE_URL=`"$SITE_URL`"",
  "YANDEX_CLIENT_ID=`"$YANDEX_CLIENT_ID`"",
  "YANDEX_CLIENT_SECRET=`"$YANDEX_CLIENT_SECRET`"",
  "YANDEX_REDIRECT_URI=`"$YANDEX_REDIRECT_URI`""
) -join "`n"

$cmd = @"
cd /root/OTIVA
for key in YANDEX_CLIENT_ID YANDEX_CLIENT_SECRET YANDEX_REDIRECT_URI SITE_URL APP_URL NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_APP_URL NEXT_PUBLIC_BASE_URL; do
  sed -i "/^`${key}=/d" .env
done
cat >> .env << 'ENVEOF'
$lines
ENVEOF
echo "--- Yandex / site URL ---"
grep -E '^(SITE_URL|APP_URL|NEXT_PUBLIC_SITE_URL|YANDEX_)' .env
pm2 restart otiva --update-env
pm2 status
"@

& ssh -o StrictHostKeyChecking=accept-new $SERVER $cmd
Write-Host "Done. Test: https://nashlo.ru/login -> Yandex" -ForegroundColor Green
