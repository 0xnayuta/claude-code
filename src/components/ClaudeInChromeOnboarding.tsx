import type React from 'react';

type Props = { onDone: () => void };

/** Browser automation is not included in the personal-local build. */
export function ClaudeInChromeOnboarding({ onDone }: Props): React.ReactNode {
  onDone();
  return null;
}
