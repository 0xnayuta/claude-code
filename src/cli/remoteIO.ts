/**
 * Stubbed: Remote Control RemoteIO unavailable in personal-local build.
 *
 * In personal-local mode, RemoteIO is never actually instantiated (it's
 * gated behind --sdk-url which requires Remote Control). We provide a
 * minimal class that extends StructuredIO to satisfy type checks.
 */
import { StructuredIO } from './structuredIO.js'
import type { StdinMessage } from 'src/entrypoints/sdk/controlTypes.js'
import type { SDKMessage } from 'src/entrypoints/agentSdkTypes.js'

export class RemoteIO extends StructuredIO {
  constructor(
    streamUrl: string,
    initialPrompt?: AsyncIterable<string>,
    replayUserMessages?: boolean,
  ) {
    // In personal-local, RemoteIO is never actually used — it's gated
    // behind --sdk-url. Pass an empty async iterable as a no-op so
    // the parent constructor's read() loop doesn't block.
    const emptyInput: AsyncIterable<string> = {
      async *[Symbol.asyncIterator]() {},
    }
    super(emptyInput, replayUserMessages)
    // Mark the unused parameters as intentionally ignored
    void streamUrl
    void initialPrompt
  }

  override flushInternalEvents(): Promise<void> {
    return Promise.resolve()
  }

  override get internalEventsPending(): number {
    return 0
  }
}
