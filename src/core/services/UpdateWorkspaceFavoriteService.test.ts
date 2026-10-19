import { describe, expect, it } from 'vitest';
import { buildRepository, buildWorkspace } from '../../test/unit/fakes';
import { UpdateWorkspaceFavoriteService } from './UpdateWorkspaceFavoriteService';

describe('UpdateWorkspaceFavoriteService', () => {
  it('toggles the favorite flag back and forth', async () => {
    const { repository, stateManager } = buildRepository([buildWorkspace()]);
    const service = new UpdateWorkspaceFavoriteService(repository);

    await service.toggle('ws-1');
    expect(stateManager.workspaces[0].isFavorite).toBe(true);

    await service.toggle('ws-1');
    expect(stateManager.workspaces[0].isFavorite).toBe(false);
  });

  it('ignores unknown workspaces', async () => {
    const { repository, stateManager } = buildRepository([buildWorkspace()]);
    const service = new UpdateWorkspaceFavoriteService(repository);

    await service.toggle('missing');

    expect(stateManager.workspaces[0].isFavorite).toBeUndefined();
  });
});
