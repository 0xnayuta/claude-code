/**
 * OpenTelemetry no-op facade for the personal-local build.
 */

import type { Meter } from '@opentelemetry/api'

export function bootstrapTelemetry(): void {}

export function parseExporterTypes(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
}

export function isTelemetryEnabled(): boolean {
  return false
}

export async function initializeTelemetry(): Promise<Meter | null> {
  return null
}

export async function flushTelemetry(): Promise<void> {}
