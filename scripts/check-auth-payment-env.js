#!/usr/bin/env node
/**
 * Проверка наличия ENV для OAuth и T-Bank (без вывода секретов).
 * node scripts/check-auth-payment-env.js
 */
const keys = [
  "JWT_SECRET",
  "YANDEX_CLIENT_ID",
  "YANDEX_CLIENT_SECRET",
  "YANDEX_REDIRECT_URI",
  "VK_CLIENT_ID",
  "VK_CLIENT_SECRET",
  "TBANK_TERMINAL_KEY",
  "TBANK_PASSWORD",
  "TBANK_NOTIFICATION_URL",
  "SITE_URL",
  "NEXT_PUBLIC_APP_URL",
]

let ok = 0
let missing = 0
for (const key of keys) {
  const val = process.env[key]?.trim()
  if (val) {
    ok += 1
    console.log(`[ok] ${key}`)
  } else {
    missing += 1
    console.log(`[--] ${key} (не задан)`)
  }
}
console.log(`\nГотово: ${ok} задано, ${missing} не задано`)
process.exit(missing > 0 ? 1 : 0)
