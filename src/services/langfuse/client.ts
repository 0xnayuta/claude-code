/**
 * Langfuse/Otel no-op facade for the personal-local build.
 */

export type LangfuseProcessor = unknown

export function isLangfuseEnabled(): boolean {
  return false
}

export function getLangfuseProcessor(): LangfuseProcessor | null {
  return null
}

export function initLangfuse(): boolean {
  return false
}

export async function flushLangfuse(): Promise<void> {}

export async function shutdownLangfuse(): Promise<void> {}
