import { describe, expect, test } from 'bun:test'
import { builtInCommandNames, clearCommandMemoizationCaches } from '../../src/commands.js'
import { getLocalPersonalTools } from '../../src/tools.js'

// Set a mock API key so that builtInCommandNames (which calls login()
// which reads hasAnthropicApiKeyAuth() → getAnthropicApiKeyWithSource)
// does not throw "ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN env var is required"
process.env.ANTHROPIC_API_KEY = 'test-key-for-snapshot'

/**
 * Command list snapshot tests for personal-local profile.
 *
 * We directly test builtInCommandNames() which is the ground truth for
 * what commands are available in personal-local mode. The function
 * incorporates the PERSONAL_LOCAL_COMMAND_NAMES filter via
 * filterCommandsForPersonalLocal(COMMANDS()) internally.
 *
 * Since builtInCommandNames is module-level memoized and we can't
 * reliably invalidate it from outside, we verify its stable
 * characteristics rather than exact counts.
 */
describe('personal-local command list snapshot', () => {
  test('remote/enterprise commands are absent from builtInCommandNames', () => {
    const names = [...builtInCommandNames()]
    const nameSet = new Set(names)
    // These are remote/enterprise/collaboration commands that must NOT appear
    const mustNotHave = [
      'bridge',
      'daemon',
      'remote-control',
      'autonomy',
      'proactive',
      'voice',
      'coordinator',
      'peers',
      'attach',
      'detach',
      'send',
      'pipes',
      'pipe-status',
      'schedule',
      'skill-learning',
      'skill-search',
      'agents-platform',
      'mobile',
      'desktop',
      'chrome',
      'remote-env',
      'remote-setup',
      'vault',
      'local-vault',
      'memory-stores',
      'plugin',
      'workflows',
      'monitor',
      'autofix-pr',
      'review',
      'ultrareview',
      'teleport',
    ]
    const present = mustNotHave.filter(n => nameSet.has(n))
    expect(present).toHaveLength(0)
  })

  test('login and logout are present (firstParty auth)', () => {
    const names = [...builtInCommandNames()]
    expect(names).toContain('login')
    expect(names).toContain('logout')
  })

  test('no duplicate command names', () => {
    const names = [...builtInCommandNames()]
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  test('command list is stable across multiple calls', () => {
    const first = [...builtInCommandNames()].sort()
    const second = [...builtInCommandNames()].sort()
    expect(first).toEqual(second)
  })

  test('agent tool not in personal-local tool set', () => {
    // Direct tool set check - fast and reliable
    const localTools = getLocalPersonalTools()
    const toolNames = localTools.map(t => t.name)
    expect(toolNames).not.toContain('Agent')
  })

  test('personal-local tool count is exactly 11', () => {
    const localTools = getLocalPersonalTools()
    expect(localTools.length).toBe(11)
  })
})