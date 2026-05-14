#!/usr/bin/env bun
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '..')
const SRC = join(ROOT, 'src')

const TARGET_DIRS = [
  'src/bridge',
  'src/buddy',
  'src/coordinator',
  'src/daemon',
  'src/assistant',
  'src/services/acp',
  'src/utils/computerUse',
  'src/utils/claudeInChrome',
  'src/commands/assistant',
  'src/commands/bridge',
  'src/commands/buddy',
  'src/commands/chrome',
  'src/commands/daemon',
  'src/commands/remoteControlServer',
].map(p => normalize(p))

const IMPORT_RE = /(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'])

type Hit = {
  file: string
  specifier: string
  resolved: string
  target: string
  line: number
  internal: boolean
}

function isTestPath(path: string): boolean {
  return (
    path.includes(`${normalize('__tests__')}`) ||
    /(^|[\\/])tests[\\/]/.test(path) ||
    /\.(test|spec)\.[cm]?[tj]sx?$/.test(path)
  )
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue
      walk(full, out)
    } else if (EXTENSIONS.has(full.slice(full.lastIndexOf('.')))) {
      const rel = normalize(relative(ROOT, full))
      if (!isTestPath(rel)) out.push(full)
    }
  }
  return out
}

function normalizeRel(path: string): string {
  return normalize(path).replaceAll('\\', '/')
}

function resolveSpecifier(file: string, specifier: string): string | null {
  if (specifier.startsWith('src/')) return normalizeRel(specifier)
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return normalizeRel(relative(ROOT, resolve(dirname(file), specifier)))
  }
  return null
}

function findTarget(path: string): string | null {
  const normalized = normalize(path).replaceAll('\\', '/')
  for (const target of TARGET_DIRS) {
    const normalizedTarget = target.replaceAll('\\', '/')
    if (
      normalized === normalizedTarget ||
      normalized.startsWith(`${normalizedTarget}/`) ||
      normalized.startsWith(`${normalizedTarget}.`)
    ) {
      return normalizedTarget
    }
  }
  return null
}

function lineOf(content: string, index: number): number {
  let line = 1
  for (let i = 0; i < index; i++) {
    if (content.charCodeAt(i) === 10) line++
  }
  return line
}

const hits: Hit[] = []
for (const file of walk(SRC)) {
  const relFile = normalizeRel(relative(ROOT, file))
  const content = readFileSync(file, 'utf8')
  IMPORT_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = IMPORT_RE.exec(content))) {
    const specifier = match[1]
    const resolved = resolveSpecifier(file, specifier)
    if (!resolved) continue
    const target = findTarget(resolved)
    if (!target) continue
    const internal = findTarget(relFile) === target
    hits.push({
      file: relFile,
      specifier,
      resolved,
      target,
      line: lineOf(content, match.index),
      internal,
    })
  }
}

const external = hits.filter(hit => !hit.internal)

if (hits.length === 0) {
  console.log('No personal-local target references found.')
  process.exit(0)
}

console.log(`Found ${hits.length} personal-local target reference(s).`)
console.log(`External: ${external.length}`)
console.log(`Internal: ${hits.length - external.length}`)

for (const hit of external) {
  console.log(
    `${hit.file}:${hit.line}: ${hit.specifier} -> ${hit.resolved} [${hit.target}]`,
  )
}

if (external.length > 0) process.exit(1)
