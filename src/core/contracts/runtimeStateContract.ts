import type { AppState } from 'src/state/AppState.js'
import type { SetAppState } from 'src/utils/messageQueueManager.js'

export const CORE_RUNTIME_STATE_CONTRACT_VERSION = 1 as const

export type CoreRuntimeStateContract = {
  version: typeof CORE_RUNTIME_STATE_CONTRACT_VERSION
  getState: () => AppState
  setState: SetAppState
}
