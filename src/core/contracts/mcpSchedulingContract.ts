export const CORE_MCP_SCHEDULING_CONTRACT_VERSION = 1 as const

export type CoreMcpSchedulingStrategy = {
  localConcurrency: number
  remoteConcurrency: number
  separateLocalAndRemoteQueues: boolean
}

export type CoreMcpSchedulingSnapshot = {
  totalCount: number
  localCount: number
  remoteCount: number
}

export type CoreMcpSchedulingContract = {
  version: typeof CORE_MCP_SCHEDULING_CONTRACT_VERSION
  resolveStrategy: () => CoreMcpSchedulingStrategy
  snapshotBuckets: (params: {
    totalCount: number
    localCount: number
    remoteCount: number
  }) => CoreMcpSchedulingSnapshot
}
