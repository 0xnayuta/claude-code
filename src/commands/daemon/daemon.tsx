import type React from 'react';
import type { LocalJSXCommandContext } from '../../commands.js';
import type { LocalJSXCommandOnDone } from '../../types/command.js';

export async function call(
  onDone: LocalJSXCommandOnDone,
  _context: LocalJSXCommandContext,
  _args: string,
): Promise<React.ReactNode> {
  onDone('Daemon mode is unavailable in personal-local build.', { display: 'system' });
  return null;
}
