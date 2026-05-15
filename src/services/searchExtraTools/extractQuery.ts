import type { Message } from '../../types/message.js'

export function extractQueryFromMessages(
  input: string | null,
  messages: Message[],
): string {
  const parts: string[] = []

  if (input) parts.push(input)

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i] as Record<string, unknown>
    if (msg.type !== 'user') continue
    const content = msg.content
    if (typeof content === 'string') {
      parts.push(content.slice(0, 500))
      break
    }
    if (Array.isArray(content)) {
      let foundText = false
      for (const block of content) {
        const entry = block as Record<string, unknown>
        if (entry.type && entry.type !== 'text') continue
        const text = entry.text
        if (typeof text === 'string' && text.trim()) {
          parts.push(text.slice(0, 500))
          foundText = true
          break
        }
      }
      if (foundText) break
    }
  }

  return parts.join(' ')
}
