import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, relative, resolve } from 'node:path'

type Match = {
  rawSpecifier: string
  resolvedSpecifier: string
}

type Violation = {
  file: string
  forbiddenFragment: string
  match: Match
}

const ROOT = process.cwd()
const CORE_DIR = resolve(ROOT, 'src/core')

const FORBIDDEN_FRAGMENTS = [
  'src/utils/plugins',
  'src/services/plugins',
  'src/commands/plugin',
  'src/plugins',
  'src/utils/teleport',
  'src/commands/teleport',
  'src/commands/schedule',
  'src/commands/vault',
  'src/commands/skill-store',
  'src/commands/memory-stores',
  'src/commands/agents-platform',
  'src/commands/remote-setup',
  'src/commands/remote-env',
  'src/commands/share',
  'src/commands/install-github-app',
  'src/commands/install-slack-app',
  'src/services/teamMemorySync',
  'src/utils/swarm',
  'src/hooks/useInboxPoller',
  'src/hooks/useSwarm',
  'src/services/skillLearning',
  'src/services/skillSearch',
  'src/commands/skill-learning',
  'src/commands/skill-search',
  'src/utils/nativeInstaller',
  'src/utils/autoUpdater',
  'src/commands/autofix-pr',
  'src/commands/review',
  'src/commands/autonomy',
  'src/hooks/useVoiceIntegration',
  'src/commands/voice',
]

const IMPORT_PATTERNS: RegExp[] = [
  /\bimport\s+(?:type\s+)?[^'"\n]*?from\s*['"]([^'"\n]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,
]

function normalizePath(pathValue: string): string {
  return pathValue.replace(/\\/g, '/').replace(/\/+/g, '/')
}

function walkFiles(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = resolve(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...walkFiles(fullPath))
      continue
    }

    const ext = extname(entry)
    if (ext === '.ts' || ext === '.tsx') {
      files.push(fullPath)
    }
  }

  return files
}

function normalizeSpecifier(file: string, specifier: string): string {
  if (specifier.startsWith('.')) {
    const resolved = normalizePath(resolve(dirname(file), specifier))
    return normalizePath(relative(ROOT, resolved))
  }

  if (specifier.startsWith('/')) {
    return normalizePath(relative(ROOT, specifier))
  }

  return normalizePath(specifier)
}

function extractSpecifiers(content: string): string[] {
  const found = new Set<string>()

  for (const pattern of IMPORT_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      const specifier = match[1]
      if (specifier) found.add(specifier)
    }
  }

  return [...found]
}

function collectViolations(file: string): Violation[] {
  const content = readFileSync(file, 'utf8')
  const rawSpecifiers = extractSpecifiers(content)
  const violations: Violation[] = []

  for (const rawSpecifier of rawSpecifiers) {
    const resolvedSpecifier = normalizeSpecifier(file, rawSpecifier)
    for (const forbiddenFragment of FORBIDDEN_FRAGMENTS) {
      if (
        rawSpecifier.includes(forbiddenFragment) ||
        resolvedSpecifier.includes(forbiddenFragment)
      ) {
        violations.push({
          file: normalizePath(relative(ROOT, file)),
          forbiddenFragment,
          match: {
            rawSpecifier,
            resolvedSpecifier,
          },
        })
      }
    }
  }

  return violations
}

if (!statSync(CORE_DIR, { throwIfNoEntry: false })) {
  console.log('[check-core-boundaries] src/core does not exist, skip')
  process.exit(0)
}

const files = walkFiles(CORE_DIR)
const violations = files.flatMap(file => collectViolations(file))

if (violations.length === 0) {
  console.log(
    `[check-core-boundaries] OK (${files.length} files checked in src/core)`,
  )
  process.exit(0)
}

console.error(
  `[check-core-boundaries] Found ${violations.length} boundary violation(s):`,
)
for (const violation of violations) {
  console.error(`\n- File: ${violation.file}`)
  console.error(`  Forbidden: ${violation.forbiddenFragment}`)
  console.error(`  Import: ${violation.match.rawSpecifier}`)
  if (violation.match.resolvedSpecifier !== violation.match.rawSpecifier) {
    console.error(`  Resolved: ${violation.match.resolvedSpecifier}`)
  }
}

process.exit(1)
