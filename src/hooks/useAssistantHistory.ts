import type { RefObject } from 'react'
import type { ScrollBoxHandle } from '@anthropic/ink'
type RemoteSessionConfig = { hasInitialPrompt?: boolean }
import type { Message } from '../types/message.js'

type Props = {
  config: RemoteSessionConfig | undefined
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  scrollRef: RefObject<ScrollBoxHandle | null>
  onPrepend?: (indexDelta: number, heightDelta: number) => void
}

type Result = {
  maybeLoadOlder: (handle: ScrollBoxHandle) => void
}

/** Assistant remote sessions are not included in the personal-local build. */
export function useAssistantHistory(_props: Props): Result {
  return { maybeLoadOlder: () => {} }
}
