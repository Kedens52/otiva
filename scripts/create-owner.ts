#!/usr/bin/env tsx
/**
 * Bootstrap script: создаёт первого OWNER.
 * Запуск: npm run admin:create-owner
 * Флаг --force: создать дополнительного OWNER если уже есть.
 */
import * as readline from "readline"
import { PrismaClient } from "@prisma/client"
import { generateStaffCode } from "../src/lib/admin/generateStaffCode"
import { hashStaffCode } from "../src/lib/admin/staffCode"

const prisma = new PrismaClient()
const db     = prisma as any    // новые модели до prisma generate

const FORCE = process.argv.includes("--force")

// ANSI colours
const RED    = "\x1b[31m"
const YELLOW = "\x1b[33m"
const GREEN  = "\x1b[32m"
const BOLD   = "\x1b[1m"
const RESET  = "\x1b[0m"

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve))
}

async function main(): Promise<void> {
  // Проверяем существующих OWNER
  const existingOwner = await db.staffAccount.findMany({
    where: { role: "OWNER", status: { not: "REVOKED" } },
  })

  if (existingOwner.length > 0 && !FORCE) {
    console.error(
      `${RED}${BOLD}OWNER уже существует (${existingOwner.length} шт.).${RESET}`,
    )
    console.error(`Используйте ${YELLOW}--force${RESET} для создания дополнительного OWNER.`)
    await prisma.$disconnect()
    process.exit(1)
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  console.log(`${BOLD}=== Создание OWNER аккаунта ===${RESET}\n`)

  const login = (await prompt(rl, "Логин (a-z 0-9 . _ -): ")).trim()
  if (!/^[a-z0-9._-]{3,32}$/.test(login)) {
    console.error(`${RED}Неверный формат логина.${RESET}`)
    rl.close()
    await prisma.$disconnect()
    process.exit(1)
  }

  const existing = await db.staffAccount.findUnique({ where: { login } })
  if (existing) {
    console.error(`${RED}Логин "${login}" уже занят.${RESET}`)
    rl.close()
    await prisma.$disconnect()
    process.exit(1)
  }

  const displayName = (await prompt(rl, "Отображаемое имя (Enter — пропустить): ")).trim() || null
  rl.close()

  // Генерируем код
  const code     = generateStaffCode()
  const codeHash = await hashStaffCode(code)
  const now      = new Date()

  const created = await db.staffAccount.create({
    data: {
      login,
      displayName,
      role:           "OWNER",
      status:         "ACTIVE",
      codeHash,
      codeChangedAt:  now,
      failedAttempts: 0,
      lockedUntil:    null,
      lastLoginAt:    null,
      lastLoginIp:    null,
      lastUserAgent:  null,
      revokedAt:      null,
      createdById:    null,
    },
  })

  // Пишем audit без actorId (bootstrap)
  await db.adminAuditLog.create({
    data: {
      actorId:    null,
      action:     "ADMIN_OWNER_BOOTSTRAP",
      targetType: "StaffAccount",
      targetId:   created.id,
      metadata:   { login, displayName },
      ip:         null,
      userAgent:  null,
    },
  })

  console.log(`\n${GREEN}${BOLD}✓ OWNER создан успешно${RESET}`)
  console.log(`  ID:    ${created.id}`)
  console.log(`  Логин: ${login}`)
  console.log(`\n${RED}${BOLD}╔══════════════════════════════════════════╗`)
  console.log(`║  ПЕРСОНАЛЬНЫЙ КОД — СОХРАНИТЕ СЕЙЧАС!   ║`)
  console.log(`║  Повторно код не будет показан.          ║`)
  console.log(`╠══════════════════════════════════════════╣`)
  console.log(`║  ${BOLD}${code}${RESET}${RED}${BOLD}                          ║`)
  console.log(`╚══════════════════════════════════════════╝${RESET}\n`)

  await prisma.$disconnect()
  process.exit(0)
}

main().catch(async (err) => {
  console.error(`${RED}Ошибка:${RESET}`, (err as Error).message)
  await prisma.$disconnect()
  process.exit(1)
})
