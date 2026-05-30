$SERVER = "root@185.154.193.6"

Write-Host "Updating .env on server..." -ForegroundColor Yellow

$cmd = @'
cd /root/OTIVA
sed -i '/^TBANK_/d' .env
sed -i '/^NEXT_PUBLIC_TBANK_/d' .env
sed -i '/^NEXT_PUBLIC_APP_URL/d' .env
cat >> .env << 'EOF'
TBANK_TERMINAL_KEY="1777894900212"
NEXT_PUBLIC_TBANK_TERMINAL_KEY="1777894900212"
TBANK_PASSWORD="GDMZMCrRO5#_r4gm"
TBANK_SUCCESS_URL="https://nashlo.ru/payment/success"
TBANK_FAIL_URL="https://nashlo.ru/payment/fail"
TBANK_NOTIFICATION_URL="https://nashlo.ru/api/payments/tbank/webhook"
NEXT_PUBLIC_APP_URL="https://nashlo.ru"
EOF
echo "--- .env T-Bank section ---"
grep "TBANK_\|NEXT_PUBLIC_APP" /root/OTIVA/.env
echo "--- PM2 restart ---"
pm2 restart otiva --update-env
pm2 status
'@

& ssh -o StrictHostKeyChecking=accept-new $SERVER $cmd
Write-Host "Done!" -ForegroundColor Green
