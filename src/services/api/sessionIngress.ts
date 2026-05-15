import type { Entry, TranscriptMessage } from '../../types/logs.js'

export async function appendSessionLog(
  _sessionId: string,
  _entry: TranscriptMessage,
  _url: string,
): Promise<boolean> {
  return false
}

export async function getSessionLogs(
  _sessionId: string,
  _url: string,
): Promise<Entry[] | null> {
  return null
}

export async function getSessionLogsViaOAuth(
  _sessionId: string,
  _accessToken: string,
  _orgUUID: string,
): Promise<Entry[] | null> {
  return null
}

export async function getTeleportEvents(
  _sessionId: string,
  _accessToken: string,
  _orgUUID: string,
): Promise<Entry[] | null> {
  return null
}

export function clearSession(_sessionId: string): void {}

export function clearAllSessions(): void {}
