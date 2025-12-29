const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

function isTruthy(value) {
  const v = String(value || '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

function antigravityRoot() {
  return path.resolve(process.env.ANTIGRAVITY_ROOT_DIR || path.join(os.homedir(), '_inbox', 'antigravity'))
}

function projectRoot(projectName) {
  return path.join(antigravityRoot(), projectName)
}

function assertNotPublicPath(filePath) {
  if (isTruthy(process.env.ALLOW_PUBLIC_WRITE)) return
  const normalized = String(filePath || '').replaceAll('\\', '/')
  if (normalized.includes('/public/') || normalized.startsWith('public/') || normalized === 'public') {
    throw new Error(`Refusing to write into public/: ${filePath} (set ALLOW_PUBLIC_WRITE=1 to override)`)
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
  return dirPath
}

function inboxDir(projectName, ...parts) {
  const dirPath = path.join(projectRoot(projectName), ...parts)
  assertNotPublicPath(dirPath)
  return ensureDir(dirPath)
}

function timestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function uniquePath(filePath) {
  assertNotPublicPath(filePath)
  if (!fs.existsSync(filePath)) return filePath
  const ext = path.extname(filePath)
  const base = filePath.slice(0, filePath.length - ext.length)
  return `${base}-${timestamp()}${ext}`
}

module.exports = {
  antigravityRoot,
  projectRoot,
  inboxDir,
  uniquePath,
  assertNotPublicPath,
}

