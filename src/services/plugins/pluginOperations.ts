export type PluginOperationResult = {
  success: boolean
  message: string
  alreadyUpToDate?: boolean
  oldVersion?: string
  newVersion?: string
}

const DISABLED_MESSAGE = 'Plugin runtime removed in core-local profile'

export async function installPluginOp(
  _plugin: string,
  _scope?: string,
): Promise<PluginOperationResult> {
  return { success: false, message: DISABLED_MESSAGE }
}

export async function uninstallPluginOp(
  _plugin: string,
  _scope?: string,
  _removeData?: boolean,
): Promise<PluginOperationResult> {
  return { success: false, message: DISABLED_MESSAGE }
}

export async function enablePluginOp(
  _plugin: string,
  _scope?: string,
): Promise<PluginOperationResult> {
  return { success: false, message: DISABLED_MESSAGE }
}

export async function disablePluginOp(
  _plugin: string,
  _scope?: string,
): Promise<PluginOperationResult> {
  return { success: false, message: DISABLED_MESSAGE }
}

export async function updatePluginOp(
  _plugin: string,
  _scope?: string,
): Promise<PluginOperationResult> {
  return {
    success: false,
    message: DISABLED_MESSAGE,
    alreadyUpToDate: true,
  }
}
