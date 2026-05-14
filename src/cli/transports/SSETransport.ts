// Stubbed: Remote Control transports unavailable in personal-local build.
// Transport classes are stubs; parseSSEFrames keeps its full implementation
// (needed by gemini client and tests).
import type { StdoutMessage } from 'src/entrypoints/sdk/controlTypes.js'

// ---------------------------------------------------------------------------
// parseSSEFrames — full implementation kept for gemini client + tests
// ---------------------------------------------------------------------------

type SSEFrame = {
  event?: string
  id?: string
  data?: string
}

/**
 * Incrementally parse SSE frames from a text buffer.
 * Returns parsed frames and the remaining (incomplete) buffer.
 *
 * @internal exported for testing
 */
export function parseSSEFrames(buffer: string): {
  frames: SSEFrame[]
  remaining: string
} {
  const frames: SSEFrame[] = []
  let pos = 0

  // SSE frames are delimited by an empty line. Support LF and CRLF streams.
  const frameDelimiter = /\r?\n\r?\n/g
  frameDelimiter.lastIndex = pos

  let delimiterMatch: RegExpExecArray | null
  while ((delimiterMatch = frameDelimiter.exec(buffer)) !== null) {
    const frameEnd = delimiterMatch.index
    const rawFrame = buffer.slice(pos, frameEnd)
    pos = frameEnd + delimiterMatch[0].length

    // Skip empty frames
    if (!rawFrame.trim()) continue

    const frame: SSEFrame = {}
    let isComment = false

    for (const rawLine of rawFrame.split('\n')) {
      // Normalize CRLF lines in mixed-line-ending streams.
      const line =
        rawLine[rawLine.length - 1] === '\r' ? rawLine.slice(0, -1) : rawLine

      if (line.startsWith(':')) {
        // SSE comment (e.g. `:keepalive`)
        isComment = true
        continue
      }

      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) continue

      const field = line.slice(0, colonIdx)
      // Per SSE spec, strip one leading space after colon if present
      const value =
        line[colonIdx + 1] === ' '
          ? line.slice(colonIdx + 2)
          : line.slice(colonIdx + 1)

      switch (field) {
        case 'event':
          frame.event = value
          break
        case 'id':
          frame.id = value
          break
        case 'data':
          // Per SSE spec, multiple data: lines are concatenated with \n
          frame.data = frame.data ? frame.data + '\n' + value : value
          break
        // Ignore other fields (retry:, etc.)
      }
    }

    // Only emit frames that have data (or are pure comments which reset liveness)
    if (frame.data || isComment) {
      frames.push(frame)
    }
  }

  return { frames, remaining: buffer.slice(pos) }
}

// ---------------------------------------------------------------------------
// Transport interface
// ---------------------------------------------------------------------------

export type Transport = {
  connect(): Promise<void>
  write(message: StdoutMessage): Promise<void>
  close(): void
  isConnectedStatus(): boolean
}

// ---------------------------------------------------------------------------
// StreamClientEvent
// ---------------------------------------------------------------------------

export type StreamClientEvent = {
  event_id: string
  sequence_num: number
  event_type: string
  source: string
  payload: Record<string, unknown>
  created_at: string
}

// ---------------------------------------------------------------------------
// SSETransport — stub (not used in personal-local but exported for types)
// ---------------------------------------------------------------------------

export class SSETransport {
  private _connected = false

  constructor(
    _url: URL,
    _headers: Record<string, string> = {},
    _sessionId?: string,
    _refreshHeaders?: () => Record<string, string>,
    _initialSequenceNum?: number,
    _getAuthHeaders?: () => Record<string, string>,
  ) {}

  async connect(): Promise<void> {
    this._connected = true
  }

  async write(_message: StdoutMessage): Promise<void> {}

  close(): void {
    this._connected = false
  }

  isConnectedStatus(): boolean {
    return this._connected
  }

  isClosedStatus(): boolean {
    return !this._connected
  }

  getLastSequenceNum(): number {
    return 0
  }

  setOnData(_callback: (data: string) => void): void {}

  setOnClose(_callback: (closeCode?: number) => void): void {}

  setOnEvent(_callback: (event: StreamClientEvent) => void): void {}
}

// ---------------------------------------------------------------------------
// WebSocketTransport — stub
// ---------------------------------------------------------------------------

export type WebSocketTransportOptions = {
  autoReconnect?: boolean
  isBridge?: boolean
}

export class WebSocketTransport {
  private _connected = false

  constructor(
    _url: URL,
    _headers: Record<string, string> = {},
    _sessionId?: string,
    _refreshHeaders?: () => Record<string, string>,
    _options?: WebSocketTransportOptions,
  ) {}

  async connect(): Promise<void> {
    this._connected = true
  }

  async write(_message: StdoutMessage): Promise<void> {}

  close(): void {
    this._connected = false
  }

  isConnectedStatus(): boolean {
    return this._connected
  }

  isClosedStatus(): boolean {
    return !this._connected
  }

  getStateLabel(): string {
    return this._connected ? 'connected' : 'disabled'
  }

  setOnData(_callback: (data: string) => void): void {}

  setOnClose(_callback: (closeCode?: number) => void): void {}

  setOnConnect(_callback: () => void): void {}
}

// ---------------------------------------------------------------------------
// HybridTransport — stub
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// CCRClient — stub
// ---------------------------------------------------------------------------

export type CCRInitFailReason =
  | 'transport_error'
  | 'auth_error'
  | 'network_error'
  | 'server_error'
  | 'unknown'

export class CCRInitError extends Error {
  constructor(
    message: string,
    public readonly reason: CCRInitFailReason,
  ) {
    super(message)
    this.name = 'CCRInitError'
  }
}

export type InternalEvent = {
  event_id: string
  event_type: string
  source: string
  created_at: string
  payload: Record<string, unknown>
}

export type StreamAccumulatorState = {
  buffer: string
  accumulated: unknown[]
  lastSeqNum: number
}

export function createStreamAccumulator(): StreamAccumulatorState {
  return { buffer: '', accumulated: [], lastSeqNum: 0 }
}

export function accumulateStreamEvents(
  _buffer: string,
  _state: StreamAccumulatorState,
): unknown[] {
  return _state.accumulated
}

export function clearStreamAccumulatorForMessage(
  _state: StreamAccumulatorState,
  _assistant: unknown,
): void {}

export class CCRClient {
  constructor(
    _transport: SSETransport | HybridTransport,
    _sessionUrl: URL,
    _opts?: {
      getAuthHeaders?: () => Record<string, string>
      heartbeatIntervalMs?: number
      heartbeatJitterFraction?: number
      onEpochMismatch?: () => void
    },
  ) {}

  async initialize(_epoch?: number): Promise<Record<string, unknown> | null> {
    return null
  }

  async writeEvent(_message: StdoutMessage): Promise<void> {}

  async writeInternalEvent(
    _eventType: string,
    _payload: Record<string, unknown>,
    _opts?: unknown,
  ): Promise<void> {}

  async flushInternalEvents(): Promise<void> {}

  async flush(): Promise<void> {}

  async readInternalEvents(): Promise<InternalEvent[] | null> {
    return null
  }

  async readSubagentInternalEvents(): Promise<InternalEvent[] | null> {
    return null
  }

  reportState(_state: unknown, _details?: unknown): void {}

  reportMetadata(_metadata: Record<string, unknown>): void {}

  reportDelivery(_eventId: string, _status: string): void {}

  getWorkerEpoch(): number {
    return 0
  }

  get internalEventsPending(): number {
    return 0
  }

  close(): void {}
}

// ---------------------------------------------------------------------------
// transportUtils — stub
// ---------------------------------------------------------------------------

export function getTransportForUrl(
  _url: URL,
  _headers: Record<string, string> = {},
  _sessionId?: string,
  _refreshHeaders?: () => Record<string, string>,
): Transport {
  return new WebSocketTransport(_url, _headers, _sessionId, _refreshHeaders)
}
