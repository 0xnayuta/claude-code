import { isEnvTruthy } from '../envUtils.js'

function isUserPromptLoggingEnabled(): boolean {
  return isEnvTruthy(process.env.OTEL_LOG_USER_PROMPTS)
}

export function redactIfDisabled(content: string): string {
  return isUserPromptLoggingEnabled() ? content : '<REDACTED>'
}

export async function logOTelEvent(..._args: unknown[]): Promise<void> {}
