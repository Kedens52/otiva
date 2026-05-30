#!/usr/bin/env node
/**
 * Восстановление после P3009 (failed migration в _prisma_migrations).
 * Безопасно запускать перед каждым migrate deploy — операции идемпотентны.
 */
const { execSync } = require("child_process")

const FAILED_BADGE_MIGRATION = "20260520140000_badge_first_step"

function run(cmd, options = {}) {
  try {
    const out = execSync(cmd, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      ...options,
    })
    return { ok: true, out: out ?? "" }
  } catch (error) {
    const out = [error.stdout, error.stderr].filter(Boolean).join("\n")
    return { ok: false, out: out || error.message }
  }
}

function main() {
  console.log("[recover-migrations] Ensuring BadgeCode.FIRST_STEP exists…")
  const sql = 'ALTER TYPE "BadgeCode" ADD VALUE IF NOT EXISTS \'FIRST_STEP\';'
  const sqlRun = run("npx prisma db execute --stdin", { input: sql })
  if (!sqlRun.ok) {
    console.warn("[recover-migrations] db execute warning:", sqlRun.out.trim())
  }

  const status = run("npx prisma migrate status")
  const statusText = status.out + (status.ok ? "" : status.out)

  const hasFailed =
    /failed/i.test(statusText) ||
    /P3009/i.test(statusText) ||
    statusText.includes(FAILED_BADGE_MIGRATION)

  if (!hasFailed) {
    console.log("[recover-migrations] No failed migrations detected, skipping resolve.")
    return
  }

  console.log(`[recover-migrations] Resolving ${FAILED_BADGE_MIGRATION}…`)

  let resolved = run(`npx prisma migrate resolve --applied "${FAILED_BADGE_MIGRATION}"`)
  if (!resolved.ok) {
    console.log("[recover-migrations] --applied failed, trying --rolled-back…")
    resolved = run(`npx prisma migrate resolve --rolled-back "${FAILED_BADGE_MIGRATION}"`)
  }

  if (resolved.ok) {
    console.log("[recover-migrations] Migration marked resolved.")
  } else {
    console.warn("[recover-migrations] Could not auto-resolve:", resolved.out.trim())
    console.warn(
      "[recover-migrations] Run manually on server:\n" +
        `  npx prisma migrate resolve --applied "${FAILED_BADGE_MIGRATION}"\n` +
        "  npx prisma migrate deploy",
    )
    process.exit(1)
  }
}

main()
