import type {
  CoreQueryParams,
  CoreQueryStreamEvent,
} from 'src/core/contracts/queryContract.js'
import type { ToolUseContext } from 'src/Tool.js'
import type { Message } from 'src/types/message.js'
import type { CoreQueryConfig, CoreTokenBudgetState } from 'src/core/contracts/queryContract.js'
import type { CoreQueryRuntimeDefaults } from './coreQueryConfig.js'
import { DEFAULT_QUERY_RUNTIME_DEFAULTS } from './coreQueryConfig.js'

// ── Turn state ─────────────────────────────────────────────────────────────

export type CoreQueryTurnState = {
  turnCount: number
  usedMessages: Message[]
  tokenBudget: CoreTokenBudgetState
  lastTransition: string | undefined
  hasAttemptedReactiveCompact: boolean
  maxOutputTokensOverride: number | undefined
  pendingToolUseSummary: unknown | undefined
  stopHookActive: boolean | undefined
}

export const INITIAL_QUERY_TURN_STATE: CoreQueryTurnState = {
  turnCount: 0,
  usedMessages: [],
  tokenBudget: { totalBudget: 0, usedTokens: 0, remainingTokens: 0, continuationCount: 0 },
  lastTransition: undefined,
  hasAttemptedReactiveCompact: false,
  maxOutputTokensOverride: undefined,
  pendingToolUseSummary: undefined,
  stopHookActive: false,
}

// ── Turn result ─────────────────────────────────────────────────────────────

export type CoreQueryTurnResult =
  | { type: 'stop'; reason: string; messages: Message[] }
  | { type: 'continue'; nextState: CoreQueryTurnState }
  | { type: 'compact'; compactedMessages: Message[]; nextState: CoreQueryTurnState }
  | { type: 'error'; error: unknown; nextState: CoreQueryTurnState }

// ── Core query loop interface ────────────────────────────────────────────────

export type CoreQueryLoopStep = (
  params: CoreQueryParams,
  state: CoreQueryTurnState,
) => Promise<CoreQueryTurnResult>

export type CoreQueryLoopDelegate = {
  executeToolCalls: (params: {
    toolCalls: Array<{ name: string; args: Record<string, unknown> }>
    context: ToolUseContext
  }) => Promise<{ results: unknown[]; nextState: CoreQueryTurnState }>
  normalizeMessages: (messages: Message[]) => Message[]
  resolveModel: (config: CoreQueryConfig) => string
  shouldCompact: (state: CoreQueryTurnState) => boolean
  runCompact: (messages: Message[]) => Promise<{ compacted: Message[]; nextState: CoreQueryTurnState }>
}

export function getDefaultCoreQueryLoopDelegate(): CoreQueryLoopDelegate {
  return {
    async executeToolCalls({ toolCalls, context }) {
      return { results: [], nextState: INITIAL_QUERY_TURN_STATE }
    },
    normalizeMessages(messages) {
      return messages
    },
    resolveModel(config) {
      return config.model.mainLoopModel
    },
    shouldCompact(state) {
      return state.tokenBudget.remainingTokens < state.tokenBudget.totalBudget * 0.2
    },
    async runCompact(messages) {
      return { compacted: messages, nextState: INITIAL_QUERY_TURN_STATE }
    },
  }
}

// ── Main loop generator ─────────────────────────────────────────────────────

export async function* runCoreQueryLoop(
  params: CoreQueryParams,
  config: CoreQueryConfig,
  delegate: CoreQueryLoopDelegate = getDefaultCoreQueryLoopDelegate(),
  initialState: CoreQueryTurnState = INITIAL_QUERY_TURN_STATE,
): AsyncGenerator<CoreQueryStreamEvent, CoreQueryTurnResult, unknown> {
  let state = initialState
  const maxTurns = config.maxTurns ?? DEFAULT_QUERY_RUNTIME_DEFAULTS.maxTurns

  while (state.turnCount < maxTurns) {
    state = { ...state, turnCount: state.turnCount + 1 }

    yield { type: 'chunk', content: `[Turn ${state.turnCount}]` }

    if (delegate.shouldCompact(state)) {
      const { compacted, nextState } = await delegate.runCompact(params.messages)
      state = nextState
      yield { type: 'chunk', content: '[Compact applied]' }
    }

    if (state.stopHookActive) {
      return { type: 'stop', reason: 'stop-hook', messages: state.usedMessages }
    }
  }

  return { type: 'stop', reason: 'max-turns', messages: state.usedMessages }
}

// ── Query turn execution (delegated) ─────────────────────────────────────────

export async function executeCoreQueryTurn(
  params: CoreQueryParams,
  state: CoreQueryTurnState,
  delegate: CoreQueryLoopDelegate,
): Promise<CoreQueryTurnResult> {
  try {
    const { results, nextState } = await delegate.executeToolCalls({
      toolCalls: [],
      context: params.toolUseContext,
    })

    return { type: 'continue', nextState }
  } catch (error) {
    return { type: 'error', error, nextState: state }
  }
}