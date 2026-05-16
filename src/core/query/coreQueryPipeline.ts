import type { Message, UserMessage } from 'src/types/message.js'
import type { CoreQueryConfig, CoreQueryParams, CoreQuerySource } from 'src/core/contracts/queryContract.js'
import type { ToolUseContext } from 'src/Tool.js'
import type { SystemPrompt } from 'src/utils/systemPromptType.js'
import { buildCoreQueryConfig, type CoreQueryBuildConfigOptions } from './coreQueryConfig.js'
import {
  runCoreQueryLoop,
  type CoreQueryLoopDelegate,
  type CoreQueryTurnState,
  INITIAL_QUERY_TURN_STATE,
} from './coreQueryLoop.js'
import type { CoreProviderContract } from 'src/core/contracts/providerContract.js'

// ── Pipeline stage ───────────────────────────────────────────────────────────

export type CoreQueryPipelineStage =
  | { type: 'input-validation'; passed: boolean }
  | { type: 'message-normalization'; messages: Message[] }
  | { type: 'model-resolution'; model: string; fallback?: string }
  | { type: 'token-budget-check'; budget: { total: number; remaining: number }; ok: boolean }
  | { type: 'query-loop'; result: unknown }
  | { type: 'output-serialization'; output: unknown }

export type CoreQueryPipelineResult = {
  stages: CoreQueryPipelineStage[]
  outputMessages: Message[]
  totalTurns: number
  totalTokensUsed: number
}

// ── Pipeline delegate (core-owned skeleton) ──────────────────────────────────

export type CoreQueryPipelineDelegate = {
  validateInput: (params: CoreQueryParams) => boolean
  normalizeMessages: (messages: Message[]) => Message[]
  resolveModel: (config: CoreQueryConfig) => string
  checkTokenBudget: (params: CoreQueryParams) => { ok: boolean; remaining: number; total: number }
  buildToolUseContext: (params: CoreQueryParams) => ToolUseContext
  serializeOutput: (messages: Message[]) => unknown
}

// ── Default pipeline delegate ─────────────────────────────────────────────────

export function getDefaultPipelineDelegate(): CoreQueryPipelineDelegate {
  return {
    validateInput(params) {
      if (!params.messages || params.messages.length === 0) return false
      if (!params.systemPrompt) return false
      return true
    },
    normalizeMessages(messages) {
      return messages
    },
    resolveModel(config) {
      return config.model.mainLoopModel
    },
    checkTokenBudget(params) {
      const total = params.taskBudget?.total ?? 500_000
      return { ok: true, remaining: total, total }
    },
    buildToolUseContext(params) {
      return params.toolUseContext
    },
    serializeOutput(messages) {
      return { type: 'messages', count: messages.length, messages }
    },
  }
}

// ── Main pipeline ───────────────────────────────────────────────────────────

export async function runCoreQueryPipeline(
  userMessage: UserMessage,
  systemPrompt: SystemPrompt,
  context: ToolUseContext,
  configOptions: CoreQueryBuildConfigOptions,
  delegate: CoreQueryPipelineDelegate = getDefaultPipelineDelegate(),
  loopDelegate: CoreQueryLoopDelegate,
): Promise<CoreQueryPipelineResult> {
  const stages: CoreQueryPipelineStage[] = []
  const config = buildCoreQueryConfig(configOptions)

  // Stage 1: input validation
  const testParams: CoreQueryParams = {
    messages: [],
    systemPrompt,
    userContext: {},
    systemContext: {},
    canUseTool: () => true,
    toolUseContext: context,
    querySource: 'core-runtime' as CoreQuerySource,
  }
  const validationPassed = delegate.validateInput(testParams)
  stages.push({ type: 'input-validation', passed: validationPassed })

  if (!validationPassed) {
    return { stages, outputMessages: [], totalTurns: 0, totalTokensUsed: 0 }
  }

  // Stage 2: message normalization
  const normalizedMessages = delegate.normalizeMessages([])
  stages.push({ type: 'message-normalization', messages: normalizedMessages })

  // Stage 3: model resolution
  const model = delegate.resolveModel(config)
  stages.push({
    type: 'model-resolution',
    model,
    fallback: config.model.fallbackModel,
  })

  // Stage 4: token budget check
  const budget = delegate.checkTokenBudget(testParams)
  stages.push({ type: 'token-budget-check', budget: { total: budget.total, remaining: budget.remaining }, ok: budget.ok })

  if (!budget.ok) {
    return {
      stages,
      outputMessages: [],
      totalTurns: 0,
      totalTokensUsed: 0,
    }
  }

  // Stage 5: query loop (consume via for...of to collect events)
  const fullParams: CoreQueryParams = {
    messages: normalizedMessages,
    systemPrompt,
    userContext: {},
    systemContext: {},
    canUseTool: () => true,
    toolUseContext: delegate.buildToolUseContext({ ...testParams, messages: normalizedMessages }),
    querySource: 'core-runtime' as CoreQuerySource,
  }

  const loopGenerator = runCoreQueryLoop(fullParams, config, loopDelegate, INITIAL_QUERY_TURN_STATE)
  const loopResult = await loopGenerator.next()
  stages.push({ type: 'query-loop', result: loopResult.done ?? 'running' })

  // Stage 6: output serialization
  const outputMessages = normalizedMessages
  const serialized = delegate.serializeOutput(outputMessages)
  stages.push({ type: 'output-serialization', output: serialized })

  return {
    stages,
    outputMessages,
    totalTurns: 0,
    totalTokensUsed: 0,
  }
}