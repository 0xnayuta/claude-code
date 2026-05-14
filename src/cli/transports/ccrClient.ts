// Re-export all CCR client stubs from the shared index
export { CCRClient } from './index.js'
export { CCRInitError } from './index.js'
export type { CCRInitFailReason } from './index.js'
export type { InternalEvent } from './index.js'
export type { StreamAccumulatorState } from './index.js'
export {
  createStreamAccumulator,
  accumulateStreamEvents,
  clearStreamAccumulatorForMessage,
} from './index.js'
