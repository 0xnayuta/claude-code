import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { getLocalPersonalTools } from '../../src/tools.js'
import { getEmptyToolPermissionContext } from '../../src/Tool.js'
import { resetSettingsCache } from '../../src/utils/settings/settingsCache.js'

const savedPersonalLocal = process.env.CLAUDE_CODE_LOCAL_PERSONAL

describe('personal-local tool preset snapshot', () => {
  beforeEach(() => {
    process.env.CLAUDE_CODE_LOCAL_PERSONAL = '1'
    resetSettingsCache()
  })

  afterEach(() => {
    if (savedPersonalLocal === undefined) {
      delete process.env.CLAUDE_CODE_LOCAL_PERSONAL
    } else {
      process.env.CLAUDE_CODE_LOCAL_PERSONAL = savedPersonalLocal
    }
    resetSettingsCache()
  })

  test('personal-local tool preset contains core coding tools', () => {
    const tools = getLocalPersonalTools()
    const names = tools.map(t => t.name)

    // Core coding tools must be present
    const mustHave = ['Bash', 'Glob', 'Grep', 'Read', 'Edit', 'Write', 'TodoWrite', 'EnterPlanMode', 'ExitPlanMode']
    for (const tool of mustHave) {
      expect(names).toContain(tool)
    }
  })

  test('personal-local tool preset does not include removed feature tools', () => {
    const tools = getLocalPersonalTools()
    const names = tools.map(t => t.name)

    // Agent/subagent is not personal-local (high cost + complexity)
    expect(names).not.toContain('Agent')

    // Bridge/remote collaboration tools are not personal-local
    expect(names).not.toContain('SendMessage')
    expect(names).not.toContain('SendUserFile')
    expect(names).not.toContain('ListPeers')
    expect(names).not.toContain('PushNotification')

    // Computer use / browser automation not personal-local
    expect(names).not.toContain('ComputerUse')
    expect(names).not.toContain('WebBrowser')

    // Task scheduling / cron not personal-local
    expect(names).not.toContain('CronCreate')
    expect(names).not.toContain('CronDelete')
    expect(names).not.toContain('CronList')

    // Workflow / Execute not personal-local
    expect(names).not.toContain('Workflow')
    expect(names).not.toContain('Execute')

    // Task tools not personal-local (agent orchestration)
    expect(names).not.toContain('TaskCreate')
    expect(names).not.toContain('TaskGet')
    expect(names).not.toContain('TaskUpdate')
    expect(names).not.toContain('TaskList')
  })

  test('personal-local tool count is bounded (11 tools exactly)', () => {
    const tools = getLocalPersonalTools()
    // personal-local has exactly 11 core tools (see getLocalPersonalTools())
    expect(tools.length).toBe(11)
  })

  test('all tools in personal-local preset have name and call function', () => {
    const tools = getLocalPersonalTools()
    for (const tool of tools) {
      expect(typeof tool.name).toBe('string')
      expect(tool.name.length).toBeGreaterThan(0)
      expect(typeof tool.call).toBe('function')
    }
  })

  test('personal-local tools have no duplicate names', () => {
    const tools = getLocalPersonalTools()
    const names = tools.map(t => t.name)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  test('getTools returns same tools as getLocalPersonalTools for personal-local', async () => {
    const { getTools } = await import('../../src/tools.js')
    const tools = getTools(getEmptyToolPermissionContext())
    const preset = getLocalPersonalTools()

    expect(tools.length).toBe(preset.length)
    expect(tools.map(t => t.name)).toEqual(preset.map(t => t.name))
  })
})