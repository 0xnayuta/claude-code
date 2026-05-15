import React, { useEffect } from 'react'
import { Box, Text } from '@anthropic/ink'

type Props = {
  initialTeams?: unknown[]
  onDone: (selectedTeam?: unknown) => void
}

export function TeamsDialog({ onDone }: Props): React.ReactNode {
  useEffect(() => {
    onDone(undefined)
  }, [onDone])

  return (
    <Box flexDirection="column">
      <Text>Teams are disabled in this build.</Text>
    </Box>
  )
}
