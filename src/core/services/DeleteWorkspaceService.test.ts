import { describe, expect, it } from 'vitest';
import {
  buildRepository,
  buildUserInteraction,
  buildWorkspace,
} from '../../test/unit/fakes';
import { DeleteWorkspaceService } from './DeleteWorkspaceService';

function setup() {
  const { repository, stateManager } = buildRepository([
    buildWorkspace({ id: 'a' }),
  ]);
  const { fake, userInteraction } = buildUserInteraction();
  const service = new DeleteWorkspaceService(repository, userInteraction);
  return { service, stateManager, fake };
}

describe('DeleteWorkspaceService', () => {
  it('deletes the workspace after confirmation', async () => {
    const { service, stateManager, fake } = setup();
    fake.showConfirmation.mockResolvedValue(true);

    await service.delete('a');

    expect(stateManager.workspaces).toEqual([]);
    expect(fake.showInfo).toHaveBeenCalledWith(
      'Workspace deleted successfully.',
    );
  });

  it('keeps the workspace when the user declines', async () => {
    const { service, stateManager, fake } = setup();
    fake.showConfirmation.mockResolvedValue(false);

    await service.delete('a');

    expect(stateManager.workspaces).toHaveLength(1);
    expect(fake.showInfo).not.toHaveBeenCalled();
  });
});
