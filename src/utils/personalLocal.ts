import { isEnvTruthy } from './envUtils.js'

/**
 * Personal-local profile for a trimmed, single-user local coding agent.
 *
 * This profile is intentionally runtime controlled so it can be enabled in
 * development or by a built binary without requiring a separate entrypoint:
 *   - CLAUDE_CODE_LOCAL_PERSONAL=1
 *   - --personal-local (sets the env var during CLI startup)
 */
export function isPersonalLocalProfileEnabled(): boolean {
  return (
    isEnvTruthy(process.env.CLAUDE_CODE_LOCAL_PERSONAL) ||
    process.argv.includes('--personal-local')
  )
}
