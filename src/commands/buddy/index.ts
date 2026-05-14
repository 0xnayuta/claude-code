import type { Command } from '../../commands.js'

const buddy: Command = {
  type: 'local',
  name: 'buddy',
  description: 'Buddy is unavailable in personal-local build',
  isEnabled: () => false,
  isHidden: true,
  supportsNonInteractive: true,
  load: async () => ({
    call: async () => ({
      type: 'text',
      value: 'Buddy is unavailable in personal-local build.',
    }),
  }),
}

export default buddy
