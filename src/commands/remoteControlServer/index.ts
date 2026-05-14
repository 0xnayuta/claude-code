import type { Command } from '../../commands.js'

const remoteControlServer: Command = {
  type: 'local',
  name: 'remote-control-server',
  description: 'Remote Control Server is unavailable in personal-local build',
  isEnabled: () => false,
  isHidden: true,
  supportsNonInteractive: true,
  load: async () => ({
    call: async () => ({
      type: 'text',
      value: 'Remote Control Server is unavailable in personal-local build.',
    }),
  }),
}

export default remoteControlServer
