import { feature } from 'bun:bundle'
import type { Command } from 'src/commands.js'
import { ListMcpResourcesTool } from '@claude-code-best/builtin-tools/tools/ListMcpResourcesTool/ListMcpResourcesTool.js'
import { ReadMcpResourceTool } from '@claude-code-best/builtin-tools/tools/ReadMcpResourceTool/ReadMcpResourceTool.js'
import { createMcpAuthTool } from '@claude-code-best/builtin-tools/tools/McpAuthTool/McpAuthTool.js'
import {
  getMcpToolsCommandsAndResources as getMcpToolsCommandsAndResourcesImpl,
  clearServerCache,
  setupSdkMcpClients,
  fetchToolsForClient,
  fetchCommandsForClient,
  reconnectMcpServerImpl,
  callIdeRpc,
} from '../../services/mcp/client.js'
import {
  connectToServer as connectToServerImpl,
  getMcpServerConnectionBatchSize as getMcpServerConnectionBatchSizeImpl,
} from '../../services/mcp/client.js'
import { markClaudeAiMcpConnected } from 'src/services/mcp/claudeai.js'
import { logEvent } from 'src/services/analytics/index.js'
import pMap from 'p-map'
import type { Tool } from 'src/Tool.js'
import { errorMessage } from 'src/utils/errors.js'
import { logMCPError } from 'src/utils/log.js'
import { jsonStringify } from 'src/utils/slowOperations.js'
import type {
  MCPServerConnection,
  ScopedMcpServerConfig,
} from 'src/services/mcp/types.js'
import type {
  CoreMcpSchedulingSnapshot,
  CoreMcpSchedulingStrategy,
} from 'src/core/contracts/mcpSchedulingContract.js'

export type { MCPResultType } from '../../services/mcp/client.js'
export {
  clearServerCache,
  setupSdkMcpClients,
  fetchToolsForClient,
  reconnectMcpServerImpl,
  callIdeRpc,
}

// Re-exported from legacy client — pending contract-based replacement
// TODO(Phase B): replace with core-owned connectToServer via transport contract
export const connectToServer = connectToServerImpl
export const getMcpServerConnectionBatchSize = getMcpServerConnectionBatchSizeImpl

export function getRemoteMcpServerConnectionBatchSize(): number {
  return (
    parseInt(process.env.MCP_REMOTE_SERVER_CONNECTION_BATCH_SIZE || '', 10) ||
    20
  )
}

export function getServerCacheKey(
  name: string,
  serverRef: ScopedMcpServerConfig,
): string {
  return `${name}-${jsonStringify(serverRef)}`
}

export function areMcpConfigsEqual(
  a: ScopedMcpServerConfig,
  b: ScopedMcpServerConfig,
): boolean {
  if (a.type !== b.type) return false

  const { scope: _scopeA, ...configA } = a
  const { scope: _scopeB, ...configB } = b
  return jsonStringify(configA) === jsonStringify(configB)
}

export type McpTransportType =
  | 'stdio'
  | 'sse'
  | 'http'
  | 'ws'
  | 'sse-ide'
  | 'ws-ide'
  | 'claudeai-proxy'
  | 'sdk'

export function resolveMcpTransportType(
  config: ScopedMcpServerConfig,
): McpTransportType {
  return config.type ?? 'stdio'
}

export function isLocalMcpServer(config: ScopedMcpServerConfig): boolean {
  const type = resolveMcpTransportType(config)
  return type === 'stdio' || type === 'sdk'
}

export function isRemoteMcpServer(config: ScopedMcpServerConfig): boolean {
  return !isLocalMcpServer(config)
}

export function describeMcpTransportType(config: ScopedMcpServerConfig): string {
  const type = resolveMcpTransportType(config)
  const labels: Record<McpTransportType, string> = {
    stdio: 'stdio (local)',
    sse: 'SSE (remote)',
    http: 'HTTP (remote)',
    ws: 'WebSocket (remote)',
    'sse-ide': 'SSE-IDE',
    'ws-ide': 'WS-IDE',
    'claudeai-proxy': 'claude.ai proxy',
    sdk: 'SDK (in-process)',
  }
  return labels[type] ?? `unknown (${type})`
}

export function mcpConnectionShouldUseHttps(config: ScopedMcpServerConfig): boolean {
  const type = resolveMcpTransportType(config)
  return type === 'sse' || type === 'http' || type === 'ws'
}

export function mcpToolInputToAutoClassifierInput(
  input: Record<string, unknown>,
  toolName: string,
): string {
  const keys = Object.keys(input)
  return keys.length > 0
    ? keys.map(k => `${k}=${String(input[k])}`).join(' ')
    : toolName
}

export function buildMcpSchedulingBuckets(
  mcpConfigs: Record<string, ScopedMcpServerConfig>,
): CoreMcpSchedulingSnapshot {
  const entries = Object.entries(mcpConfigs)
  const localCount = entries.filter(([, config]) => isLocalMcpServer(config)).length
  return {
    totalCount: entries.length,
    localCount,
    remoteCount: entries.length - localCount,
  }
}

export type McpConnectionAttempt = {
  client: MCPServerConnection
  tools: Tool[]
  commands: Command[]
  resources?: import('src/services/mcp/types.js').ServerResource[]
}

export type McpConnectDelegate = (params: {
  name: string
  config: ScopedMcpServerConfig
}) => Promise<McpConnectionAttempt[]>

export type McpFetchDelegate = (params: {
  name: string
  config: ScopedMcpServerConfig
  connected: McpConnectionAttempt[]
}) => Promise<McpConnectionAttempt[]>

export type McpAssembleDelegate = (params: {
  attempts: McpConnectionAttempt[]
  onConnectionAttempt: (params: McpConnectionAttempt) => void
}) => Promise<void>

export type McpPipelineDelegates = {
  connect: McpConnectDelegate
  fetch: McpFetchDelegate
  assemble: McpAssembleDelegate
}

export type GetMcpToolsCommandsAndResourcesOptions = {
  schedulingStrategy?: CoreMcpSchedulingStrategy
  delegates?: Partial<McpPipelineDelegates>
}

export function getDefaultMcpSchedulingStrategy(): CoreMcpSchedulingStrategy {
  return {
    localConcurrency: getMcpServerConnectionBatchSize(),
    remoteConcurrency: getRemoteMcpServerConnectionBatchSize(),
    separateLocalAndRemoteQueues: true,
  }
}

export function getDefaultMcpPipelineDelegates(): McpPipelineDelegates {
  return {
    connect: async ({ name, config }) => {
      const client = await connectToServer(name, config)

      if (client.type !== 'connected') {
        return [{
          client,
          tools:
            client.type === 'needs-auth'
              ? [createMcpAuthTool(name, config)]
              : [],
          commands: [],
        }]
      }

      if (config.type === 'claudeai-proxy') {
        markClaudeAiMcpConnected(name)
      }

      return [{ client, tools: [], commands: [] }]
    },
    fetch: async ({ connected }) => {
      const fetched: McpConnectionAttempt[] = []
      await Promise.all(
        connected.map(async (attempt) => {
          if (attempt.client.type !== 'connected') {
            fetched.push(attempt)
            return
          }
          const client = attempt.client
          const supportsResources = !!client.capabilities?.resources
          const [tools, commands] = await Promise.all([
            fetchToolsForClient(client),
            fetchCommandsForClient(client),
          ])
          fetched.push({
            ...attempt,
            tools: [...attempt.tools, ...tools],
            commands: [...attempt.commands, ...commands],
          })
        }),
      )
      return fetched
    },
    assemble: async ({ attempts, onConnectionAttempt }) => {
      for (const attempt of attempts) {
        onConnectionAttempt(attempt)
      }
    },
  }
}

export async function getMcpToolsCommandsAndResources(
  onConnectionAttempt: (params: McpConnectionAttempt) => void,
  mcpConfigs?: Record<string, ScopedMcpServerConfig>,
  options?: GetMcpToolsCommandsAndResourcesOptions,
): Promise<void> {
  if (!mcpConfigs || Object.keys(mcpConfigs).length === 0) {
    return
  }

  const strategy =
    options?.schedulingStrategy ?? getDefaultMcpSchedulingStrategy()
  const delegates: McpPipelineDelegates = {
    ...getDefaultMcpPipelineDelegates(),
    ...(options?.delegates ?? {}),
  }

  const entries = Object.entries(mcpConfigs)
  const localEntries = entries.filter(([, config]) => isLocalMcpServer(config))
  const remoteEntries = entries.filter(([, config]) => isRemoteMcpServer(config))

  const processEntries = async (
    bucketEntries: Array<[string, ScopedMcpServerConfig]>,
    concurrency: number,
  ): Promise<void> => {
    if (bucketEntries.length === 0) return

    await pMap(
      bucketEntries,
      async ([name, config]) => {
        const connected = await delegates.connect({ name, config })
        const fetched = await delegates.fetch({ name, config, connected })
        await delegates.assemble({
          attempts: fetched,
          onConnectionAttempt,
        })
      },
      { concurrency: Math.max(1, concurrency) },
    )
  }

  if (!strategy.separateLocalAndRemoteQueues) {
    await processEntries(entries, strategy.localConcurrency)
    return
  }

  await Promise.all([
    processEntries(localEntries, strategy.localConcurrency),
    processEntries(remoteEntries, strategy.remoteConcurrency),
  ])
}

export function prefetchAllMcpResources(
  mcpConfigs: Record<string, ScopedMcpServerConfig>,
): Promise<{
  clients: MCPServerConnection[]
  tools: Tool[]
  commands: Command[]
}> {
  return new Promise(resolve => {
    const pendingCount = buildMcpSchedulingBuckets(mcpConfigs).totalCount
    let completedCount = 0

    if (pendingCount === 0) {
      void resolve({
        clients: [],
        tools: [],
        commands: [],
      })
      return
    }

    const clients: MCPServerConnection[] = []
    const tools: Tool[] = []
    const commands: Command[] = []

    getMcpToolsCommandsAndResources(result => {
      clients.push(result.client)
      tools.push(...result.tools)
      commands.push(...result.commands)

      completedCount++
      if (completedCount >= pendingCount) {
        const commandsMetadataLength = commands.reduce((sum, command) => {
          const commandMetadataLength =
            command.name.length +
            (command.description ?? '').length +
            (command.argumentHint ?? '').length
          return sum + commandMetadataLength
        }, 0)
        logEvent('tengu_mcp_tools_commands_loaded', {
          tools_count: tools.length,
          commands_count: commands.length,
          commands_metadata_length: commandsMetadataLength,
        })

        void resolve({
          clients,
          tools,
          commands,
        })
      }
    }, mcpConfigs).catch(error => {
      logMCPError(
        'prefetchAllMcpResources',
        `Failed to get MCP resources: ${errorMessage(error)}`,
      )
      void resolve({
        clients: [],
        tools: [],
        commands: [],
      })
    })
  })
}