import type { ClaudeCodeHint } from '../claudeCodeHints.js'
export type PluginHintRecommendation = { pluginId: string; pluginName: string; pluginDescription: string; marketplaceName: string; sourceCommand: string }
export function maybeRecordPluginHint(_hint: ClaudeCodeHint): void {}
export async function resolvePluginHint(_hint: ClaudeCodeHint): Promise<PluginHintRecommendation | null> { return null }
export function markHintPluginShown(_pluginId: string): void {}
export function disableHintRecommendations(): void {}
