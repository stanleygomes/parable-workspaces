import { describe, expect, it, vi } from 'vitest';
import {
  GlobalStateWorkspaceStateManager,
  buildExtensionContext,
} from './test/unit/fakes';

vi.mock('./infra/persistence/WorkspaceStateManager', async () => {
  const fakes = await import('./test/unit/fakes');
  return { WorkspaceStateManager: fakes.GlobalStateWorkspaceStateManager };
});

import { Container } from './container';

describe('Container', () => {
  it('wires every service', () => {
    const { extensionContext } = buildExtensionContext();

    const container = new Container(extensionContext);

    expect(container.workspaceStateManager).toBeInstanceOf(
      GlobalStateWorkspaceStateManager,
    );
    expect(Object.values(container).every(Boolean)).toBe(true);
    expect(Object.keys(container)).toHaveLength(18);
  });

  it('shares a single repository between services', async () => {
    const { extensionContext } = buildExtensionContext();
    const container = new Container(extensionContext);
    const listener = vi.fn();
    container.workspaceRepository.onDidChange(listener);

    await container.UpdateWorkspaceFavoriteService.toggle('missing');
    await container.workspaceRepository.delete('missing');

    expect(listener).toHaveBeenCalledOnce();
    expect(container.FindWorkspaceService.search('')).toEqual([]);
  });
});
