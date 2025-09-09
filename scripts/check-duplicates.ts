import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('src')
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

const contentMap = new Map<string, string>()
const exportMap = new Map<string, Map<string, string>>()
let hasError = false

function isIgnored(filePath: string): boolean {
  const rel = filePath.replace(/\\/g, '/')
  if (/\/node_modules\//.test(rel)) return true
  if (/\/\.git\//.test(rel)) return true
  if (/\/(tests?|__tests__|fixtures)\//.test(rel)) return true
  if (/\.(test|spec)\.[tj]sx?$/.test(rel)) return true
  if (/\.d\.ts$/.test(rel)) return true
  return false
}

function normalizeContent(content: string): string {
  const noComments = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n\r]*/g, '')
  return noComments.replace(/\s+/g, '')
}

function extractDefaultExportName(src: string): string | null {
  let match = src.match(/export\s+default\s+function\s+([A-Za-z0-9_$]+)/)
  if (match) return match[1]
  match = src.match(/export\s+default\s+([A-Za-z0-9_$]+)/)
  return match ? match[1] : null
}

function getDomain(filePath: string): string {
  const rel = path.relative(ROOT, filePath)
  const parts = rel.split(path.sep)
  return parts.length > 1 ? parts[0] : 'root'
}

function processFile(filePath: string) {
  if (isIgnored(filePath)) return
  const ext = path.extname(filePath)
  if (!EXTENSIONS.has(ext)) return
  const content = fs.readFileSync(filePath, 'utf8')
  const normalized = normalizeContent(content)
  const existing = contentMap.get(normalized)
  if (existing) {
    console.error(
      `Duplicate content between ${path.relative(process.cwd(), existing)} and ${path.relative(process.cwd(), filePath)}`,
    )
    hasError = true
  } else {
    contentMap.set(normalized, filePath)
  }

  const defaultName = extractDefaultExportName(content)
  if (defaultName) {
    const domain = getDomain(filePath)
    const domainMap = exportMap.get(domain) ?? new Map<string, string>()
    const other = domainMap.get(defaultName)
    if (other) {
      console.error(
        `Duplicate default export "${defaultName}" in domain "${domain}" between ${path.relative(
          process.cwd(),
          other,
        )} and ${path.relative(process.cwd(), filePath)}`,
      )
      hasError = true
    } else {
      domainMap.set(defaultName, filePath)
      exportMap.set(domain, domainMap)
    }
  }
}

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (isIgnored(fullPath)) continue
    if (entry.isDirectory()) {
      walk(fullPath)
    } else if (entry.isFile()) {
      processFile(fullPath)
    }
  }
}

walk(ROOT)

if (hasError) {
  console.error('Duplicate files detected')
  process.exit(1)
} else {
  console.log('No duplicates found')
}

