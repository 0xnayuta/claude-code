import type { Command } from '../commands.js'

const bridgeKick: Command = {
  type: 'local',
  name: 'bridge-kick',
  description: 'Remote Control is unavailable in personal-local build',
  isEnabled: () => false,
  isHidden: true,
  supportsNonInteractive: true,
  load: async () => ({
    call: async () => ({
      type: 'text',
      value: 'Remote Control is unavailable in personal-local build.',
    }),
  }),
}

export default bridgeKick
