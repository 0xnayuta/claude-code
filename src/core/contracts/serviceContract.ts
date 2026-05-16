import type { APIProvider } from 'src/utils/model/providers.js'
import type { MCPServerConnection } from 'src/services/mcp/types.js'

export const CORE_SERVICE_CONTRACT_VERSION = 1 as const

export type CoreServiceContract = {
  version: typeof CORE_SERVICE_CONTRACT_VERSION
  getProvider: () => APIProvider
  listMcpClients: () => MCPServerConnection[]
  refreshMcpClients: () => Promise<void>
}
