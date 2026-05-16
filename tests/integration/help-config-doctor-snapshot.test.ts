import { describe, expect, test } from 'bun:test'
import { builtInCommandNames } from '../../src/commands.js'
import help from '../../src/commands/help/index.js'
import config from '../../src/commands/config/index.js'
import doctor from '../../src/commands/doctor/index.js'

process.env.ANTHROPIC_API_KEY = 'test-key-for-snapshot'

describe('help/config/doctor output surface snapshot', () => {
  test('core command names contain help/config/doctor', () => {
    const names = builtInCommandNames()
    expect(names.has('help')).toBe(true)
    expect(names.has('config')).toBe(true)
    expect(names.has('doctor')).toBe(true)
  })

  test('help command metadata is stable', async () => {
    expect(help.name).toBe('help')
    expect(help.type).toBe('local-jsx')
    expect(help.description).toBe('Show help and available commands')

    const mod = await help.load()
    expect(typeof mod.call).toBe('function')
  })

  test('config command metadata is stable', async () => {
    expect(config.name).toBe('config')
    expect(config.type).toBe('local-jsx')
    expect(config.description).toBe('Open config panel')
    expect(config.aliases).toEqual(['settings'])

    const mod = await config.load()
    expect(typeof mod.call).toBe('function')
  })

  test('doctor command metadata is stable', async () => {
    expect(doctor.name).toBe('doctor')
    expect(doctor.type).toBe('local-jsx')
    expect(doctor.description).toBe('Diagnose and verify your Claude Code installation and settings')
    expect(doctor.isEnabled?.()).toBe(true)

    const mod = await doctor.load()
    expect(typeof mod.call).toBe('function')
  })
})
