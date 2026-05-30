# Yandex + VK OAuth на production (https://nashlo.ru)
# Запуск: .\setup-oauth-production.ps1
# VK_CLIENT_SECRET: вставьте ключ из https://id.vk.com (раздел «Защищённый ключ»)

param(
  [string]$VkClientSecret = ""
)

$SERVER = "root@185.154.193.6"
$SITE_URL = "https://nashlo.ru"

$YANDEX_CLIENT_ID = "9f0ea463eae349df8d23323f494ce4bb"
$YANDEX_CLIENT_SECRET = "5110f35d8e894afda56bb9ef5f7f142d"
$YANDEX_REDIRECT_URI = "https://nashlo.ru/api/auth/yandex/callback"

$VK_CLIENT_ID = "54574778"
$VK_REDIRECT_URI = "https://nashlo.ru/api/auth/vk/callback"

if (-not $VkClientSecret) {
  Write-Host "Подсказка: передайте VK secret: .\setup-oauth-production.ps1 -VkClientSecret 'ваш_ключ'" -ForegroundColor Yellow
}

Write-Host "Updating OAuth env on server..." -ForegroundColor Yellow

$lines = @(
  "SITE_URL=`"$SITE_URL`"",
  "APP_URL=`"$SITE_URL`"",
  "NEXT_PUBLIC_SITE_URL=`"$SITE_URL`"",
  "NEXT_PUBLIC_APP_URL=`"$SITE_URL`"",
  "NEXT_PUBLIC_BASE_URL=`"$SITE_URL`"",
  "YANDEX_CLIENT_ID=`"$YANDEX_CLIENT_ID`"",
  "YANDEX_CLIENT_SECRET=`"$YANDEX_CLIENT_SECRET`"",
  "YANDEX_REDIRECT_URI=`"$YANDEX_REDIRECT_URI`"",
  "VK_CLIENT_ID=`"$VK_CLIENT_ID`"",
  "NEXT_PUBLIC_VK_APP_ID=`"$VK_CLIENT_ID`"",
  "VK_REDIRECT_URI=`"$VK_REDIRECT_URI`"",
  "NEXT_PUBLIC_VK_REDIRECT_URI=`"$VK_REDIRECT_URI`""
)

if ($VkClientSecret) {
  $lines += "VK_CLIENT_SECRET=`"$VkClientSecret`""
}

$envBlock = $lines -join "`n"

$cmd = @"
cd /root/OTIVA
for key in SITE_URL APP_URL NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_APP_URL NEXT_PUBLIC_BASE_URL YANDEX_CLIENT_ID YANDEX_CLIENT_SECRET YANDEX_REDIRECT_URI VK_CLIENT_ID NEXT_PUBLIC_VK_APP_ID VK_CLIENT_SECRET VK_REDIRECT_URI NEXT_PUBLIC_VK_REDIRECT_URI; do
  sed -i "/^`${key}=/d" .env
done
cat >> .env << 'ENVEOF'
$envBlock
ENVEOF
echo "--- OAuth env ---"
grep -E '^(SITE_URL|YANDEX_|VK_|NEXT_PUBLIC_VK)' .env
pm2 restart otiva --update-env
"@

& ssh -o StrictHostKeyChecking=accept-new $SERVER $cmd
Write-Host "Done. Test VK: https://nashlo.ru/login" -ForegroundColor Green
