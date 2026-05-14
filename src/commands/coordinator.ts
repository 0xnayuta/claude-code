import type { Command } from '../commands.js'

const coordinator: Command = {
  type: 'local',
  name: 'coordinator',
  description: 'Coordinator mode is unavailable in personal-local build',
  isEnabled: () => false,
  isHidden: true,
  supportsNonInteractive: true,
  load: async () => ({
    call: async () => ({
      type: 'text',
      value: 'Coordinator mode is unavailable in personal-local build.',
    }),
  }),
}

export default coordinator
