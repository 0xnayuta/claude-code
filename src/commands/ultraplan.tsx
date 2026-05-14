import type { Command } from '../commands.js';

export const CCR_TERMS_URL = '';

export async function launchUltraplan(..._args: unknown[]): Promise<string> {
  return 'Ultraplan is unavailable in personal-local build.';
}
export function stopUltraplan(..._args: unknown[]): void {}

const ultraplan: Command = {
  type: 'local',
  name: 'ultraplan',
  description: 'Unavailable in personal-local build',
  isEnabled: () => false,
  isHidden: true,
  supportsNonInteractive: true,
  load: async () => ({ call: async () => ({ type: 'text', value: 'Unavailable in personal-local build.' }) }),
};

export default ultraplan;
