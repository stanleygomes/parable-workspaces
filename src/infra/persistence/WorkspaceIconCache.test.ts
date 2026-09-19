import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceIconCache } from './WorkspaceIconCache';
import { FaviconHelper } from '../../core/helpers/FaviconHelper';
import type { Workspace } from '../../core/dtos/Workspace';

vi.mock('vscode', () => ({
  ExtensionContext: class {},
}));

describe('WorkspaceIconCache', () => {
  let workspace: Workspace;
  let cache: WorkspaceIconCache;

  beforeEach(() => {
    FaviconHelper.clearCache();
    workspace = {
      id: 'ws-1',
      name: 'Demo',
      folders: ['/tmp/demo'],
      tags: [],
      lastOpened: 1,
    };
    cache = new WorkspaceIconCache({
      globalState: {
        get: vi.fn(() => ({})),
        update: vi.fn(async () => undefined),
      },
    } as never);
  });

  it('returns a usable configured icon without scanning when detectIcons is false', () => {
    workspace.icon = '/tmp/demo/custom.png';
    const usable = vi
      .spyOn(FaviconHelper, 'isCachedPathUsable')
      .mockReturnValue(true);
    const resolveSpy = vi.spyOn(FaviconHelper, 'resolveIconPath');

    expect(cache.resolve(workspace, true, false)).toBe('/tmp/demo/custom.png');
    expect(resolveSpy).not.toHaveBeenCalled();
    usable.mockRestore();
    resolveSpy.mockRestore();
  });

  it('does not scan the filesystem when detectIcons is false and no icon is configured', () => {
    const resolveSpy = vi.spyOn(FaviconHelper, 'resolveIconPath');
    expect(cache.resolve(workspace, true, false)).toBeUndefined();
    expect(resolveSpy).not.toHaveBeenCalled();
    resolveSpy.mockRestore();
  });

  it('returns cached detection results on subsequent resolves', () => {
    const resolveSpy = vi
      .spyOn(FaviconHelper, 'resolveIconPath')
      .mockReturnValue('/tmp/demo/public/favicon.png');
    const usable = vi
      .spyOn(FaviconHelper, 'isCachedPathUsable')
      .mockReturnValue(true);

    expect(cache.resolve(workspace, true, true)).toBe(
      '/tmp/demo/public/favicon.png',
    );
    expect(cache.resolve(workspace, false, true)).toBe(
      '/tmp/demo/public/favicon.png',
    );
    expect(resolveSpy).toHaveBeenCalledTimes(1);
    resolveSpy.mockRestore();
    usable.mockRestore();
  });

  it('skips warming when detectIcons is false', () => {
    const resolveSpy = vi.spyOn(FaviconHelper, 'resolveIconPath');
    cache.warm([workspace], true, false);
    expect(resolveSpy).not.toHaveBeenCalled();
    resolveSpy.mockRestore();
  });

  it('rescans after a persisted deepComplete miss so newly added icons appear', () => {
    cache = new WorkspaceIconCache({
      globalState: {
        get: vi.fn(() => ({
          'ws-1': {
            foldersKey: '/tmp/demo|',
            deepComplete: true,
          },
        })),
        update: vi.fn(async () => undefined),
      },
    } as never);

    const resolveSpy = vi
      .spyOn(FaviconHelper, 'resolveIconPath')
      .mockReturnValue('/tmp/demo/assets/favicon.png');
    const usable = vi
      .spyOn(FaviconHelper, 'isCachedPathUsable')
      .mockReturnValue(true);

    expect(cache.resolve(workspace, false, true)).toBe(
      '/tmp/demo/assets/favicon.png',
    );
    expect(resolveSpy).toHaveBeenCalled();
    resolveSpy.mockRestore();
    usable.mockRestore();
  });

  it('does not reload permanent deepComplete misses from storage', () => {
    cache = new WorkspaceIconCache({
      globalState: {
        get: vi.fn(() => ({
          'ws-1': {
            foldersKey: '/tmp/demo|',
            deepComplete: true,
          },
        })),
        update: vi.fn(async () => undefined),
      },
    } as never);

    const resolveSpy = vi
      .spyOn(FaviconHelper, 'resolveIconPath')
      .mockReturnValue(undefined);

    expect(cache.resolve(workspace, true, true)).toBeUndefined();
    expect(resolveSpy).toHaveBeenCalled();
    resolveSpy.mockRestore();
  });
});
