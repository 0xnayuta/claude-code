export function loadPluginOptions(_pluginId: string): Record<string, string> {
  return {}
}

export function substituteUserConfigVariables(
  command: string,
  _pluginOptions?: Record<string, string>,
): string {
  return command
}
