import type { ScopedLspServerConfig } from './types.js'

export async function getAllLspServers(): Promise<{
  servers: Record<string, ScopedLspServerConfig>
}> {
  return {
    servers: {},
  }
}
