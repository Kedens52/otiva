/**
 * Проверка, что production-сборка Next.js содержит CSS/JS в .next/static.
 * Вызывается после `npm run build` на сервере (deploy.sh).
 */
const fs = require("fs")
const path = require("path")

const root = process.cwd()
const distDir = process.argv[2] ? path.join(root, process.argv[2]) : path.join(root, ".next")
const cssDir = path.join(distDir, "static", "css")
const chunksDir = path.join(distDir, "static", "chunks")

function countFiles(dir, ext) {
  if (!fs.existsSync(dir)) return 0
  return fs.readdirSync(dir).filter((name) => name.endsWith(ext)).length
}

const cssCount = countFiles(cssDir, ".css")
const chunkCount = countFiles(chunksDir, ".js")

if (!fs.existsSync(path.join(distDir, "BUILD_ID"))) {
  console.error("[verify-next-build] Missing .next/BUILD_ID — build incomplete.")
  process.exit(1)
}

if (cssCount < 1) {
  console.error("[verify-next-build] No CSS in .next/static/css — site will render without styles.")
  process.exit(1)
}

if (chunkCount < 1) {
  console.error("[verify-next-build] No JS chunks in .next/static/chunks.")
  process.exit(1)
}

console.log(`[verify-next-build] OK: ${cssCount} css, ${chunkCount} js chunks`)
