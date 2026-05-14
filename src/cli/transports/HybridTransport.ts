// Stubbed: Hybrid transport unavailable in personal-local build
import type { StdoutMessage } from 'src/entrypoints/sdk/controlTypes.js'
import type { WebSocketTransportOptions } from './WebSocketTransport.js'
import { WebSocketTransport } from './SSETransport.js'

export class HybridTransport extends WebSocketTransport {
  private _droppedCount = 0

  constructor(
    _url: URL,
    _headers: Record<string, string> = {},
    _sessionId?: string,
    _refreshHeaders?: () => Record<string, string>,
    _options?: WebSocketTransportOptions & {
      maxConsecutiveFailures?: number
      onBatchDropped?: (batchSize: number, failures: number) => void
    },
  ) {
    super(_url, _headers, _sessionId, _refreshHeaders, _options)
  }

  async writeBatch(_messages: StdoutMessage[]): Promise<void> {}

  get droppedBatchCount(): number {
    return this._droppedCount
  }
}
