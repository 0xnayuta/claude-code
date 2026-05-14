import { describe, expect, test } from 'bun:test'
import {
  createChildSpan,
  createSubagentTrace,
  createToolBatchSpan,
  createTrace,
  endToolBatchSpan,
  endTrace,
  initLangfuse,
  isLangfuseEnabled,
  recordLLMObservation,
  recordToolObservation,
  shutdownLangfuse,
  flushLangfuse,
} from '../index.js'
import {
  sanitizeGlobal,
  sanitizeToolInput,
  sanitizeToolOutput,
} from '../sanitize.js'

describe('Langfuse no-op facade', () => {
  test('is always disabled even when keys are configured', () => {
    process.env.LANGFUSE_PUBLIC_KEY = 'pk-test'
    process.env.LANGFUSE_SECRET_KEY = 'sk-test'
    expect(isLangfuseEnabled()).toBe(false)
    expect(initLangfuse()).toBe(false)
  })

  test('trace creation helpers return null', () => {
    expect(
      createTrace({ sessionId: 's1', model: 'claude', provider: 'firstParty' }),
    ).toBeNull()
    expect(
      createSubagentTrace({
        sessionId: 's1',
        agentType: 'Explore',
        agentId: 'a1',
        model: 'claude',
        provider: 'firstParty',
      }),
    ).toBeNull()
    expect(
      createChildSpan(null, {
        name: 'child',
        sessionId: 's1',
        model: 'claude',
        provider: 'firstParty',
      }),
    ).toBeNull()
    expect(
      createToolBatchSpan(null, { toolNames: ['Bash'], batchIndex: 0 }),
    ).toBeNull()
  })

  test('record/end/flush helpers are safe no-ops', async () => {
    recordLLMObservation(null, {
      model: 'claude',
      provider: 'firstParty',
      input: [],
      output: [],
      usage: { input_tokens: 1, output_tokens: 1 },
    })
    recordToolObservation(null, {
      toolName: 'BashTool',
      toolUseId: 'tu1',
      input: { command: 'pwd' },
      output: 'ok',
    })
    endToolBatchSpan(null)
    endTrace(null)
    await flushLangfuse()
    await shutdownLangfuse()
    expect(true).toBe(true)
  })
})

describe('Langfuse sanitizers', () => {
  test('sanitizeToolInput redacts sensitive keys', () => {
    expect(
      sanitizeToolInput('ExampleTool', {
        token: 'secret',
        keep: 'value',
      }),
    ).toEqual({ token: '[REDACTED]', keep: 'value' })
  })

  test('sanitizeToolOutput redacts FileReadTool output', () => {
    expect(sanitizeToolOutput('FileReadTool', 'file content')).toBe(
      '[file content redacted, 12 chars]',
    )
  })

  test('sanitizeGlobal recursively sanitizes strings', () => {
    const home = process.env.HOME
    if (!home) return
    expect(sanitizeGlobal({ path: `${home}/project/file.ts` })).toEqual({
      path: '~/project/file.ts',
    })
  })
})
