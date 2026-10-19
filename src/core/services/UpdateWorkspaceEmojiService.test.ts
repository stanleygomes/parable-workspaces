import { describe, expect, it } from 'vitest';
import { EMOJIS } from '../enums/Emojis';
import {
  buildRepository,
  buildUserInteraction,
  buildWorkspace,
} from '../../test/unit/fakes';
import { UpdateWorkspaceEmojiService } from './UpdateWorkspaceEmojiService';

function setup() {
  const { repository, stateManager } = buildRepository([
    buildWorkspace({ id: 'a', name: 'Alpha', emoji: '🔥' }),
  ]);
  const { fake, userInteraction } = buildUserInteraction();
  const service = new UpdateWorkspaceEmojiService(repository, userInteraction);
  return { service, stateManager, fake };
}

describe('UpdateWorkspaceEmojiService', () => {
  it('offers a "none" option followed by every emoji', async () => {
    const { service, fake } = setup();

    await service.update('a');

    const [items, options] = fake.showQuickPick.mock.calls[0];
    expect(items[0]).toEqual({
      label: '$(circle-slash)',
      description: 'None',
      emoji: '',
    });
    expect(items).toHaveLength(EMOJIS.length + 1);
    expect(options).toEqual({
      placeHolder: 'Select emoji for "Alpha"',
      matchOnDescription: true,
    });
  });

  it('saves the selected emoji', async () => {
    const { service, stateManager, fake } = setup();
    fake.showQuickPick.mockResolvedValue(EMOJIS[0]);

    await service.update('a');

    expect(stateManager.workspaces[0].emoji).toBe(EMOJIS[0].emoji);
  });

  it('clears the emoji when "none" is selected', async () => {
    const { service, stateManager, fake } = setup();
    fake.showQuickPick.mockImplementation(async (items) => items[0]);

    await service.update('a');

    expect(stateManager.workspaces[0].emoji).toBe('');
  });

  it('keeps the emoji when the quick pick is cancelled', async () => {
    const { service, stateManager } = setup();

    await service.update('a');

    expect(stateManager.workspaces[0].emoji).toBe('🔥');
  });

  it('ignores unknown workspaces', async () => {
    const { service, fake } = setup();

    await service.update('missing');

    expect(fake.showQuickPick).not.toHaveBeenCalled();
  });
});
