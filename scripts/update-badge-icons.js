#!/usr/bin/env node
/** Обновить пути icon в таблице Badge. Запуск: cd /root/OTIVA && node scripts/update-badge-icons.js */
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

const ICONS = {
  BEGINNER: "/badges/beginner.png",
  FIRST_STEP: "/badges/pervii.png",
  VERIFIED: "/badges/verified.png",
  ACTIVE: "/badges/active.png",
  TRUSTED: "/badges/trusted.png",
  SAFE_DEAL: "/badges/safe-deal.png",
  PRO: "/badges/pro.png",
  PREMIUM: "/badges/premium.png",
}

async function main() {
  for (const [code, icon] of Object.entries(ICONS)) {
    const r = await prisma.badge.updateMany({ where: { code }, data: { icon } })
    console.log(`${code} -> ${icon} (${r.count} rows)`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
