import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('os', async (importOriginal) => {
  const original = await importOriginal<typeof import('os')>();
  return { ...original, homedir: () => '/home/tester' };
});

import { OSHelper } from './OSHelper';

const originalPlatform = process.platform;

function setPlatform(platform: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', { value: platform });
}

describe('OSHelper', () => {
  beforeEach(() => {
    vi.stubEnv('APPDATA', '');
    vi.stubEnv('XDG_CONFIG_HOME', '');
  });

  afterEach(() => {
    setPlatform(originalPlatform);
    vi.unstubAllEnvs();
  });

  it('uses APPDATA on windows', () => {
    setPlatform('win32');
    vi.stubEnv('APPDATA', 'C:\\Users\\tester\\AppData\\Roaming');

    expect(OSHelper.getBaseConfigDir()).toBe(
      'C:\\Users\\tester\\AppData\\Roaming',
    );
  });

  it('falls back to AppData/Roaming on windows without APPDATA', () => {
    setPlatform('win32');

    expect(OSHelper.getBaseConfigDir()).toBe(
      path.join('/home/tester', 'AppData', 'Roaming'),
    );
  });

  it('uses Application Support on macOS', () => {
    setPlatform('darwin');

    expect(OSHelper.getBaseConfigDir()).toBe(
      path.join('/home/tester', 'Library', 'Application Support'),
    );
  });

  it('uses XDG_CONFIG_HOME on linux', () => {
    setPlatform('linux');
    vi.stubEnv('XDG_CONFIG_HOME', '/custom/config');

    expect(OSHelper.getBaseConfigDir()).toBe('/custom/config');
  });

  it('falls back to ~/.config on linux without XDG_CONFIG_HOME', () => {
    setPlatform('linux');

    expect(OSHelper.getBaseConfigDir()).toBe(
      path.join('/home/tester', '.config'),
    );
  });

  it('builds the default workspaces file path', () => {
    setPlatform('linux');
    vi.stubEnv('XDG_CONFIG_HOME', '/custom/config');

    expect(OSHelper.getDefaultConfigPath()).toBe(
      path.join('/custom/config', 'parable-workspaces', 'workspaces.json'),
    );
  });
});
