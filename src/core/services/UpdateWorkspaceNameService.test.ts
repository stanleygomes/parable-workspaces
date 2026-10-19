import { describe, expect, it } from 'vitest';
import {
  buildRepository,
  buildUserInteraction,
  buildWorkspace,
} from '../../test/unit/fakes';
import { UpdateWorkspaceNameService } from './UpdateWorkspaceNameService';

function setup() {
  const { repository, stateManager } = buildRepository([
    buildWorkspace({ id: 'a', name: 'Old name' }),
  ]);
  const { fake, userInteraction } = buildUserInteraction();
  const service = new UpdateWorkspaceNameService(repository, userInteraction);
  return { service, stateManager, fake };
}

describe('UpdateWorkspaceNameService', () => {
  it('prompts with the current name and saves the new one', async () => {
    const { service, stateManager, fake } = setup();
    fake.showInputBox.mockResolvedValue('New name');

    await service.update('a');

    expect(fake.showInputBox).toHaveBeenCalledWith({
      prompt: 'Workspace Name',
      value: 'Old name',
    });
    expect(stateManager.workspaces[0].name).toBe('New name');
  });

  it('keeps the name when the input is cancelled', async () => {
    const { service, stateManager } = setup();

    await service.update('a');

    expect(stateManager.workspaces[0].name).toBe('Old name');
  });

  it('ignores unknown workspaces', async () => {
    const { service, fake } = setup();

    await service.update('missing');

    expect(fake.showInputBox).not.toHaveBeenCalled();
  });
});
