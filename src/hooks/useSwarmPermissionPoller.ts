import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'
import type { PermissionUpdate } from '../utils/permissions/PermissionUpdateSchema.js'

type PermissionCallback = {
  requestId: string
  toolUseId: string
  onAllow: (
    updatedInput: Record<string, unknown> | undefined,
    permissionUpdates: PermissionUpdate[],
    feedback?: string,
    contentBlocks?: ContentBlockParam[],
  ) => void | Promise<void>
  onReject: (
    feedback?: string,
    contentBlocks?: ContentBlockParam[],
  ) => void | Promise<void>
}

export type PermissionResponseCallback = PermissionCallback

const callbacks = new Map<string, PermissionCallback>()

export function registerPermissionCallback(callback: PermissionCallback): void {
  callbacks.set(callback.requestId, callback)
}

export function unregisterPermissionCallback(requestId: string): void {
  callbacks.delete(requestId)
}

export function hasPermissionCallback(requestId: string): boolean {
  return callbacks.has(requestId)
}

export function clearAllPendingCallbacks(): void {
  callbacks.clear()
}

export function processMailboxPermissionResponse(params: {
  requestId: string
  decision: 'approved' | 'rejected'
  updatedInput?: Record<string, unknown>
  permissionUpdates?: unknown[]
  feedback?: string
  contentBlocks?: ContentBlockParam[]
}): boolean {
  const cb = callbacks.get(params.requestId)
  if (!cb) return false
  callbacks.delete(params.requestId)
  if (params.decision === 'approved') {
    cb.onAllow(
      params.updatedInput,
      (params.permissionUpdates ?? []) as PermissionUpdate[],
      params.feedback,
      params.contentBlocks,
    )
  } else {
    cb.onReject(params.feedback)
  }
  return true
}

export type SandboxPermissionResponseCallback = {
  requestId: string
  workerName: string
  host: string
  onResponse: (allow: boolean) => void
}

export function registerSandboxPermissionCallback(
  _callback: SandboxPermissionResponseCallback,
): void {}

export function hasSandboxPermissionCallback(_requestId: string): boolean {
  return false
}

export function processSandboxPermissionResponse(_params: {
  requestId: string
  workerName: string
  host: string
  allow: boolean
  teamName?: string
}): boolean {
  return false
}

export function useSwarmPermissionPoller(): void {}
