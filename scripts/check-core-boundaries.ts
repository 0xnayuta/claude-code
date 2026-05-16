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

type MarkerBudget = {
  id: string
  pattern: RegExp
  maxMatches: number
}

type TopologySnapshot = {
  version: number
  targets: Record<string, string[]>
}

const ROOT = process.cwd()
const SRC_DIR = resolve(ROOT, 'src')
const CORE_DIR = resolve(ROOT, 'src/core')
const COMMANDS_FILE = resolve(ROOT, 'src/commands.ts')
const TOPOLOGY_SNAPSHOT_FILE = resolve(
  ROOT,
  'scripts/snapshots/core-topology.snapshot.json',
)

const TOPOLOGY_TARGET_FILES = [
  'src/entrypoints/cli.tsx',
  'src/main.tsx',
  'src/commands.ts',
  'src/tools.ts',
  'src/query.ts',
  'src/QueryEngine.ts',
  'src/screens/REPL.tsx',
] as const

const FORBIDDEN_FRAGMENTS = [
  // Existing legacy domains
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

  // Core-9 hard fences: prevent core->legacy re-entry by broad domain
  'src/plugins/',
  'src/teleport/',
  'src/swarm/',
  'src/team/',
  'src/remote/',
  'src/ultraplan/',
]

const LEGACY_COMMAND_DENYLIST = [
  'plugin',
  'ultraplan',
  'review',
  'ultrareview',
  'autofixPr',
] as const

// Compat allowlist budget (Core-8 strategy A): keep a tiny bounded set.
// Budgets may shrink over time, but should not grow.
const COMPAT_MARKER_BUDGETS: MarkerBudget[] = [
  {
    id: 'remote_agent_compat_type',
    pattern: /\bremote_agent\b/g,
    maxMatches: 10,
  },
]

// Removed Core-8 markers must stay removed.
const REMOVED_MARKER_BUDGETS: MarkerBudget[] = [
  { id: 'showRemoteCallout_removed', pattern: /\bshowRemoteCallout\b/g, maxMatches: 0 },
  { id: 'ultraplanSessionUrl_removed', pattern: /\bultraplanSessionUrl\b/g, maxMatches: 0 },
  { id: 'ultraplanLaunching_removed', pattern: /\bultraplanLaunching\b/g, maxMatches: 0 },
  { id: 'ultraplanPendingChoice_removed', pattern: /\bultraplanPendingChoice\b/g, maxMatches: 0 },
  { id: 'ultraplanLaunchPending_removed', pattern: /\bultraplanLaunchPending\b/g, maxMatches: 0 },
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

function collectImportViolations(file: string): Violation[] {
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

function countPatternInText(text: string, pattern: RegExp): number {
  const matches = text.match(pattern)
  return matches ? matches.length : 0
}

function checkLegacyCommandDenylist(): string[] {
  const content = readFileSync(COMMANDS_FILE, 'utf8')
  const failures: string[] = []

  for (const name of LEGACY_COMMAND_DENYLIST) {
    const nullDeclPattern = new RegExp(`\\bconst\\s+${name}\\s*=\\s*null\\b`)
    if (!nullDeclPattern.test(content)) {
      failures.push(
        `legacy command gate reopened: expected "const ${name} = null" in src/commands.ts`,
      )
    }
  }

  return failures
}

function checkMarkerBudgets(files: string[], budgets: MarkerBudget[]): string[] {
  const errors: string[] = []

  const combined = files.map(file => readFileSync(file, 'utf8')).join('\n')
  for (const budget of budgets) {
    const count = countPatternInText(combined, budget.pattern)
    if (count > budget.maxMatches) {
      errors.push(
        `${budget.id}: found ${count} matches (max ${budget.maxMatches})`,
      )
    }
  }

  return errors
}

function shouldTrackTopologySpecifier(specifier: string): boolean {
  return (
    specifier.startsWith('src/') ||
    specifier.startsWith('@claude-code-best/') ||
    specifier.startsWith('@anthropic/') ||
    specifier.startsWith('@ant/')
  )
}

function collectTopologySnapshot(): TopologySnapshot {
  const targets: Record<string, string[]> = {}

  for (const relativeFile of TOPOLOGY_TARGET_FILES) {
    const absoluteFile = resolve(ROOT, relativeFile)
    const content = readFileSync(absoluteFile, 'utf8')
    const specifiers = extractSpecifiers(content)
      .map(specifier => normalizeSpecifier(absoluteFile, specifier))
      .filter(shouldTrackTopologySpecifier)
      .sort((a, b) => a.localeCompare(b))

    targets[relativeFile] = specifiers
  }

  return {
    version: 1,
    targets,
  }
}

function compareTopologySnapshot(current: TopologySnapshot): string[] {
  const errors: string[] = []

  const raw = readFileSync(TOPOLOGY_SNAPSHOT_FILE, 'utf8')
  const expected = JSON.parse(raw) as TopologySnapshot

  const expectedFiles = Object.keys(expected.targets).sort((a, b) => a.localeCompare(b))
  const currentFiles = Object.keys(current.targets).sort((a, b) => a.localeCompare(b))

  const missingFiles = expectedFiles.filter(file => !currentFiles.includes(file))
  const newFiles = currentFiles.filter(file => !expectedFiles.includes(file))

  if (missingFiles.length > 0) {
    errors.push(
      `topology snapshot missing target file(s): ${missingFiles.join(', ')}`,
    )
  }
  if (newFiles.length > 0) {
    errors.push(`topology snapshot has new target file(s): ${newFiles.join(', ')}`)
  }

  for (const file of expectedFiles) {
    const expectedDeps = expected.targets[file] ?? []
    const currentDeps = current.targets[file] ?? []

    const added = currentDeps.filter(dep => !expectedDeps.includes(dep))
    const removed = expectedDeps.filter(dep => !currentDeps.includes(dep))

    if (added.length > 0 || removed.length > 0) {
      const parts: string[] = []
      if (added.length > 0) {
        parts.push(`added: ${added.join(', ')}`)
      }
      if (removed.length > 0) {
        parts.push(`removed: ${removed.join(', ')}`)
      }
      errors.push(`${file} -> ${parts.join(' | ')}`)
    }
  }

  return errors
}

if (!statSync(CORE_DIR, { throwIfNoEntry: false })) {
  console.log('[check-core-boundaries] src/core does not exist, skip')
  process.exit(0)
}

const coreFiles = walkFiles(CORE_DIR)
const importViolations = coreFiles.flatMap(file => collectImportViolations(file))
const srcFiles = walkFiles(SRC_DIR)
const denylistErrors = checkLegacyCommandDenylist()
const compatBudgetErrors = checkMarkerBudgets(srcFiles, COMPAT_MARKER_BUDGETS)
const removedBudgetErrors = checkMarkerBudgets(srcFiles, REMOVED_MARKER_BUDGETS)
const topologySnapshot = collectTopologySnapshot()
const topologyErrors = compareTopologySnapshot(topologySnapshot)

if (
  importViolations.length === 0 &&
  denylistErrors.length === 0 &&
  compatBudgetErrors.length === 0 &&
  removedBudgetErrors.length === 0 &&
  topologyErrors.length === 0
) {
  console.log(
    `[check-core-boundaries] OK (${coreFiles.length} files checked in src/core)`,
  )
  process.exit(0)
}

if (importViolations.length > 0) {
  console.error(
    `[check-core-boundaries] Found ${importViolations.length} core import boundary violation(s):`,
  )
  for (const violation of importViolations) {
    console.error(`\n- File: ${violation.file}`)
    console.error(`  Forbidden: ${violation.forbiddenFragment}`)
    console.error(`  Import: ${violation.match.rawSpecifier}`)
    if (violation.match.resolvedSpecifier !== violation.match.rawSpecifier) {
      console.error(`  Resolved: ${violation.match.resolvedSpecifier}`)
    }
  }
}

if (denylistErrors.length > 0) {
  console.error('\n[check-core-boundaries] Legacy command denylist violations:')
  for (const error of denylistErrors) {
    console.error(`- ${error}`)
  }
}

if (compatBudgetErrors.length > 0) {
  console.error('\n[check-core-boundaries] Compat allowlist budget exceeded:')
  for (const error of compatBudgetErrors) {
    console.error(`- ${error}`)
  }
}

if (removedBudgetErrors.length > 0) {
  console.error('\n[check-core-boundaries] Removed-marker regression detected:')
  for (const error of removedBudgetErrors) {
    console.error(`- ${error}`)
  }
}

if (topologyErrors.length > 0) {
  console.error('\n[check-core-boundaries] Dependency topology snapshot mismatch:')
  for (const error of topologyErrors) {
    console.error(`- ${error}`)
  }
  console.error(
    '- If intentional, regenerate scripts/snapshots/core-topology.snapshot.json in the same PR.',
  )
}

process.exit(1)
