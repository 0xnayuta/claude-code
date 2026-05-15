export type InstallStatus =
  | 'success'
  | 'no_permissions'
  | 'install_failed'
  | 'in_progress'

export type AutoUpdaterResult = {
  version: string | null
  status: InstallStatus
  notifications?: string[]
}

export type NpmDistTags = {
  latest?: string | null
  stable?: string | null
  beta?: string | null
}

export type MaxVersionConfig = {
  external?: string
  ant?: string
  external_message?: string
  ant_message?: string
}

export async function assertMinVersion(): Promise<void> {}

export async function getMaxVersion(): Promise<string | undefined> {
  return undefined
}

export async function getMaxVersionMessage(): Promise<string | undefined> {
  return undefined
}

export function shouldSkipVersion(_targetVersion: string): boolean {
  return false
}

export function getLockFilePath(): string {
  return '.update.lock'
}

export async function checkGlobalInstallPermissions(): Promise<{
  hasPermissions: boolean
  reason?: string
}> {
  return { hasPermissions: false, reason: 'auto-updater removed in this build' }
}

export async function getNpmDistTags(): Promise<NpmDistTags> {
  return { latest: undefined, stable: undefined, beta: undefined }
}

export async function getGcsDistTags(): Promise<NpmDistTags> {
  return { latest: undefined, stable: undefined, beta: undefined }
}
