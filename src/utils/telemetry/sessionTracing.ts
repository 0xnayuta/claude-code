import type { Span as OTelSpan } from '@opentelemetry/api'

export type Span = OTelSpan
export type LLMRequestNewContext = Record<string, unknown>

export function isBetaTracingEnabled(): boolean {
  return false
}

export function isEnhancedTelemetryEnabled(): boolean {
  return false
}

function createDummySpan(): Span {
  const span: Partial<Span> = {}
  span.spanContext = () => ({
    traceId: '0'.repeat(32),
    spanId: '0'.repeat(16),
    traceFlags: 0,
  })
  span.setAttribute = () => span as Span
  span.setAttributes = () => span as Span
  span.addEvent = () => span as Span
  span.setStatus = () => span as Span
  span.updateName = () => span as Span
  span.end = () => {}
  span.isRecording = () => false
  span.recordException = () => {}
  return span as Span
}

export function startInteractionSpan(..._args: unknown[]): Span {
  return createDummySpan()
}

export function endInteractionSpan(..._args: unknown[]): void {}

export function startLLMRequestSpan(..._args: unknown[]): Span {
  return createDummySpan()
}

export function endLLMRequestSpan(..._args: unknown[]): void {}

export function startToolSpan(..._args: unknown[]): Span {
  return createDummySpan()
}

export function startToolBlockedOnUserSpan(..._args: unknown[]): Span {
  return createDummySpan()
}

export function endToolBlockedOnUserSpan(..._args: unknown[]): void {}

export function startToolExecutionSpan(..._args: unknown[]): Span {
  return createDummySpan()
}

export function endToolExecutionSpan(..._args: unknown[]): void {}

export function endToolSpan(..._args: unknown[]): void {}

export function addToolContentEvent(..._args: unknown[]): void {}

export function getCurrentSpan(..._args: unknown[]): Span | null {
  return null
}

export function startHookSpan(..._args: unknown[]): Span {
  return createDummySpan()
}

export function endHookSpan(..._args: unknown[]): void {}
