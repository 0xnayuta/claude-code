import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type ContractSnapshot = {
  version: number
  contracts: Record<string, string[]>
}

const ROOT = process.cwd()
const SNAPSHOT_FILE = resolve(
  ROOT,
  'scripts/snapshots/core-contracts.snapshot.json',
)

const CONTRACT_FILES = [
  'src/core/contracts/commandContract.ts',
  'src/core/contracts/toolContract.ts',
  'src/core/contracts/queryContract.ts',
  'src/core/contracts/runtimeStateContract.ts',
  'src/core/contracts/serviceContract.ts',
  'src/core/contracts/mcpAuthContract.ts',
  'src/core/contracts/mcpConfigContract.ts',
  'src/core/contracts/mcpSchedulingContract.ts',
  'src/core/contracts/compactContract.ts',
  'src/core/contracts/providerContract.ts',
  'src/core/contracts/index.ts',
] as const

const EXPORT_PATTERNS: RegExp[] = [
  /export\s+const\s+([A-Za-z0-9_]+)/g,
  /export\s+type\s+([A-Za-z0-9_]+)/g,
  /export\s+interface\s+([A-Za-z0-9_]+)/g,
  /export\s+function\s+([A-Za-z0-9_]+)/g,
  /export\s+\*\s+from\s+['"]([^'"]+)['"]/g,
]

function collectExports(content: string): string[] {
  const exports = new Set<string>()
  for (const pattern of EXPORT_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      const symbol = match[1]
      if (symbol) exports.add(symbol)
    }
  }
  return [...exports].sort((a, b) => a.localeCompare(b))
}

function collectCurrentSnapshot(): ContractSnapshot {
  const contracts: Record<string, string[]> = {}
  for (const file of CONTRACT_FILES) {
    const absolute = resolve(ROOT, file)
    const content = readFileSync(absolute, 'utf8')
    contracts[file] = collectExports(content)
  }

  return {
    version: 1,
    contracts,
  }
}

function compareSnapshots(
  expected: ContractSnapshot,
  current: ContractSnapshot,
): string[] {
  const errors: string[] = []

  const expectedFiles = Object.keys(expected.contracts).sort((a, b) =>
    a.localeCompare(b),
  )
  const currentFiles = Object.keys(current.contracts).sort((a, b) =>
    a.localeCompare(b),
  )

  const missingFiles = expectedFiles.filter(file => !currentFiles.includes(file))
  const newFiles = currentFiles.filter(file => !expectedFiles.includes(file))

  if (missingFiles.length > 0) {
    errors.push(`missing contract file(s): ${missingFiles.join(', ')}`)
  }
  if (newFiles.length > 0) {
    errors.push(`new contract file(s): ${newFiles.join(', ')}`)
  }

  for (const file of expectedFiles) {
    const expectedExports = expected.contracts[file] ?? []
    const currentExports = current.contracts[file] ?? []

    const added = currentExports.filter(name => !expectedExports.includes(name))
    const removed = expectedExports.filter(name => !currentExports.includes(name))

    if (added.length > 0 || removed.length > 0) {
      const parts: string[] = []
      if (added.length > 0) parts.push(`added: ${added.join(', ')}`)
      if (removed.length > 0) parts.push(`removed: ${removed.join(', ')}`)
      errors.push(`${file} -> ${parts.join(' | ')}`)
    }
  }

  return errors
}

const expected = JSON.parse(
  readFileSync(SNAPSHOT_FILE, 'utf8'),
) as ContractSnapshot
const current = collectCurrentSnapshot()
const errors = compareSnapshots(expected, current)

if (errors.length === 0) {
  console.log(
    `[check-core-contracts] OK (${Object.keys(current.contracts).length} contract files checked)`,
  )
  process.exit(0)
}

console.error('[check-core-contracts] Contract snapshot mismatch:')
for (const error of errors) {
  console.error(`- ${error}`)
}
console.error(
  '- If intentional, update scripts/snapshots/core-contracts.snapshot.json in the same PR.',
)
process.exit(1)
