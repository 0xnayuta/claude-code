export type SetupMessage = {
  message: string
  userActionRequired: boolean
  type: 'path' | 'alias' | 'info' | 'error'
}

export async function checkInstall(_force = false): Promise<SetupMessage[]> {
  return []
}

export async function cleanupNpmInstallations(): Promise<{
  removed: number
  errors: string[]
  warnings: string[]
}> {
  return { removed: 0, errors: [], warnings: [] }
}

export async function cleanupOldVersions(): Promise<void> {}

export async function cleanupShellAliases(): Promise<SetupMessage[]> {
  return []
}

export async function installLatest(
  _channelOrVersion?: string,
  _forceReinstall?: boolean,
): Promise<{ latestVersion: string | null; wasUpdated: boolean; lockFailed: boolean }> {
  return { latestVersion: null, wasUpdated: false, lockFailed: false }
}

export async function lockCurrentVersion(): Promise<void> {}

export async function removeInstalledSymlink(): Promise<void> {}
