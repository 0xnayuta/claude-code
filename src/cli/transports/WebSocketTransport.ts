// Stubbed: WebSocket transport unavailable in personal-local build
import type { StdoutMessage } from 'src/entrypoints/sdk/controlTypes.js'

export type WebSocketTransportOptions = {
  autoReconnect?: boolean
  isBridge?: boolean
}

export class WebSocketTransport {
  constructor(
    _url: URL,
    _headers: Record<string, string> = {},
    _sessionId?: string,
    _refreshHeaders?: () => Record<string, string>,
    _options?: WebSocketTransportOptions,
  ) {}

  async connect(): Promise<void> {}

  async write(_message: StdoutMessage): Promise<void> {}

  close(): void {}

  isConnectedStatus(): boolean {
    return false
  }

  isClosedStatus(): boolean {
    return true
  }

  getStateLabel(): string {
    return 'disabled'
  }

  setOnData(_callback: (data: string) => void): void {}

  setOnClose(_callback: (closeCode?: number) => void): void {}

  setOnConnect(_callback: () => void): void {}
}
