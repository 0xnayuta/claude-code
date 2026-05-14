import React from 'react';
import { Box, Text } from '@anthropic/ink';

type Props = { onDone: () => void };

/** Remote Control is not included in the personal-local build. */
export function BridgeDialog(_props: Props): React.ReactNode {
  return (
    <Box flexDirection="column" gap={1}>
      <Text>Remote Control is not available in this personal-local build.</Text>
    </Box>
  );
}
