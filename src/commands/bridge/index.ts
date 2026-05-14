import type { Command } from '../../commands.js'

const bridge: Command = {
  type: 'local',
  name: 'bridge',
  aliases: ['remote-control', 'rc'],
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

export default bridge
