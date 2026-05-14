import type React from 'react';
import type { Command } from '../commands.js';
import type { Message } from '../types/message.js';

/**
 * Remote Control / bridge is not included in the personal-local build.
 * Keep the hook API as a no-op so REPL code does not need bridge-specific
 * conditional branches.
 */
export function useReplBridge(
  _messages: Message[],
  _setMessages: (action: React.SetStateAction<Message[]>) => void,
  _abortControllerRef: React.RefObject<AbortController | null>,
  _commands: readonly Command[],
  _mainLoopModel: string,
): { sendBridgeResult: () => void } {
  return { sendBridgeResult: () => {} };
}
