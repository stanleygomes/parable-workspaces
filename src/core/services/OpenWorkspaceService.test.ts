import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildRepository,
  buildUserInteraction,
  buildWorkspace,
} from '../../test/unit/fakes';
import { OpenWorkspaceService } from './OpenWorkspaceService';

const NOW = 1_700_000_000_000;

function setup() {
  const { repository, stateManager } = buildRepository([
    buildWorkspace({ id: 'a', folders: ['/projects/a', '/projects/b'] }),
  ]);
  const { fake, userInteraction } = buildUserInteraction();
  const service = new OpenWorkspaceService(repository, userInteraction);
  return { service, stateManager, fake };
}

describe('OpenWorkspaceService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates lastOpened and opens the primary folder', async () => {
    const { service, stateManager, fake } = setup();

    await service.open('a');

    expect(stateManager.workspaces[0].lastOpened).toBe(NOW);
    expect(fake.openFolder).toHaveBeenCalledWith('/projects/a', false);
  });

  it('forwards the new window flag', async () => {
    const { service, fake } = setup();

    await service.open('a', true);

    expect(fake.openFolder).toHaveBeenCalledWith('/projects/a', true);
  });

  it('ignores unknown workspaces', async () => {
    const { service, stateManager, fake } = setup();

    await service.open('missing');

    expect(fake.openFolder).not.toHaveBeenCalled();
    expect(stateManager.workspaces[0].lastOpened).toBe(0);
  });
});
