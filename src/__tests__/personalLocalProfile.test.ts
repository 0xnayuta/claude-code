import { afterEach, describe, expect, test } from 'bun:test'

const ENV_KEYS = [
  'ANTHROPIC_API_KEY',
  'CLAUDE_CODE_LOCAL_PERSONAL',
  'NODE_ENV',
] as const

const savedEnv: Record<string, string | undefined> = {}

function saveEnv(): void {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key]
  }
}

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = savedEnv[key]
    }
  }
}

saveEnv()

afterEach(() => {
  restoreEnv()
})

describe('personal-local profile', () => {
  test('uses the local coding tool preset by default', async () => {
    delete process.env.CLAUDE_CODE_LOCAL_PERSONAL

    const { getEmptyToolPermissionContext } = await import('../Tool')
    const { getToolsForLocalPersonalPreset, getTools } = await import(
      '../tools'
    )

    const expectedToolNames = [
      'Bash',
      'Glob',
      'Grep',
      'Read',
      'Edit',
      'Write',
      'TodoWrite',
      'EnterPlanMode',
      'ExitPlanMode',
      'WebFetch',
      'WebSearch',
    ]

    expect(getToolsForLocalPersonalPreset()).toEqual(expectedToolNames)
    expect(
      getTools(getEmptyToolPermissionContext()).map(tool => tool.name),
    ).toEqual(expectedToolNames)
  })

  test('exposes only the reduced built-in slash command surface by default', async () => {
    process.env.NODE_ENV = 'test'
    process.env.ANTHROPIC_API_KEY = 'test-key'
    delete process.env.CLAUDE_CODE_LOCAL_PERSONAL

    const { enableConfigs } = await import('../utils/config')
    enableConfigs()

    const { getCommands } = await import('../commands')
    const commandNames = (await getCommands(process.cwd()))
      .map(command => command.name)
      .sort()

    expect(commandNames).toEqual([
      'add-dir',
      'break-cache',
      'clear',
      'color',
      'compact',
      'config',
      'context',
      'copy',
      'diff',
      'doctor',
      'env',
      'exit',
      'export',
      'help',
      'hooks',
      'init',
      'lang',
      'login',
      'logout',
      'mcp',
      'memory',
      'model',
      'output-style',
      'permissions',
      'plan',
      'provider',
      'resume',
      'rewind',
      'status',
      'statusline',
      'theme',
      'usage',
      'version',
      'vim',
    ])
  })
})
