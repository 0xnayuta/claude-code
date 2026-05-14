import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgPath = resolve(__dirname, '..', 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

/**
 * Shared MACRO define map used by both dev.ts (runtime -d flags)
 * and build.ts (Bun.build define option).
 *
 * Each value is a JSON-stringified expression that replaces the
 * corresponding MACRO.* identifier at transpile / bundle time.
 *
 * VERSION is read from package.json to avoid version drift.
 */
export function getMacroDefines(): Record<string, string> {
  return {
    'MACRO.VERSION': JSON.stringify(pkg.version),
    'MACRO.BUILD_TIME': JSON.stringify(new Date().toISOString()),
    'MACRO.FEEDBACK_CHANNEL': JSON.stringify(''),
    'MACRO.ISSUES_EXPLAINER': JSON.stringify(''),
    'MACRO.NATIVE_PACKAGE_URL': JSON.stringify(''),
    'MACRO.PACKAGE_URL': JSON.stringify(''),
    'MACRO.VERSION_CHANGELOG': JSON.stringify(''),
  }
}

/**
 * Default feature flags enabled in both Bun.build and Vite builds.
 * Additional features can be enabled via FEATURE_<NAME>=1 env vars.
 *
 * Used by:
 *   - build.ts (Bun.build)
 *   - scripts/vite-plugin-feature-flags.ts (Vite/Rollup)
 *   - scripts/dev.ts (bun run dev)
 */
export const DEFAULT_BUILD_FEATURES = [
  // Personal-local default: keep only features that directly support a
  // single-user local coding agent. Optional capabilities can still be enabled
  // explicitly with FEATURE_<NAME>=1 when running dev/build.
  'PROMPT_CACHE_BREAK_DETECTION', // 检测 prompt cache 是否被打破（有 10 条上限，可控）
  'TOKEN_BUDGET', // Token 预算管理与控制
  'POOR', // 穷鬼模式，跳过 extract_memories/prompt_suggestion 减少消耗
] as const
