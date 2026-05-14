import { isEnvDefinedFalsy, isEnvTruthy } from './envUtils.js'

/**
 * Personal-local profile for a trimmed, single-user local coding agent.
 *
 * This profile is the default product mode for this fork. It can still be
 * made explicit with:
 *   - CLAUDE_CODE_LOCAL_PERSONAL=1
 *   - --personal-local (sets the env var during CLI startup)
 *
 * For development/debugging of the historical full product surface, set
 * CLAUDE_CODE_LOCAL_PERSONAL=0/false/no/off before startup.
 */
export function isPersonalLocalProfileEnabled(): boolean {
  if (isEnvTruthy(process.env.CLAUDE_CODE_LOCAL_PERSONAL)) return true
  if (process.argv.includes('--personal-local')) return true
  return !isEnvDefinedFalsy(process.env.CLAUDE_CODE_LOCAL_PERSONAL)
}
