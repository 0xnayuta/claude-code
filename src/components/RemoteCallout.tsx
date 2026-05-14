import type React from 'react';

export function shouldShowRemoteCallout(): boolean {
  return false;
}

type Props = { onDone: (selection: 'enable' | 'dismiss') => void };

/** Remote Control is not included in the personal-local build. */
export function RemoteCallout({ onDone }: Props): React.ReactNode {
  onDone('dismiss');
  return null;
}
