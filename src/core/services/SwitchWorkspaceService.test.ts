import { describe, expect, it, vi } from 'vitest';
import {
  buildRepository,
  buildUserInteraction,
  buildWorkspace,
} from '../../test/unit/fakes';
import type { Workspace } from '../dtos/Workspace';
import type { OpenWorkspaceService } from './OpenWorkspaceService';
import { SwitchWorkspaceService } from './SwitchWorkspaceService';

function setup(initial: Workspace[]) {
  const { repository } = buildRepository(initial);
  const { fake, userInteraction } = buildUserInteraction();
  const openService = { open: vi.fn() };
  const service = new SwitchWorkspaceService(
    repository,
    openService as unknown as OpenWorkspaceService,
    userInteraction,
  );
  return { service, openService, fake };
}

describe('SwitchWorkspaceService', () => {
  it('offers to save when there are no workspaces', async () => {
    const { service, fake } = setup([]);
    fake.showInfo.mockResolvedValue('Save Current Workspace');

    await service.switch();

    expect(fake.showInfo).toHaveBeenCalledWith(
      'No workspaces saved yet.',
      'Save Current Workspace',
    );
    expect(fake.executeCommand).toHaveBeenCalledWith(
      'workspaceManager.saveProject',
    );
    expect(fake.showQuickPick).not.toHaveBeenCalled();
  });

  it('does nothing when the empty state prompt is dismissed', async () => {
    const { service, fake } = setup([]);

    await service.switch();

    expect(fake.executeCommand).not.toHaveBeenCalled();
  });

  it('lists workspaces by recency with emoji and primary folder', async () => {
    const { service, fake } = setup([
      buildWorkspace({ id: 'old', name: 'Old', lastOpened: 1 }),
      buildWorkspace({
        id: 'new',
        name: 'New',
        emoji: '🚀',
        folders: ['/projects/new'],
        lastOpened: 2,
      }),
      buildWorkspace({ id: 'empty', name: 'Empty', folders: [] }),
    ]);

    await service.switch();

    expect(fake.showQuickPick).toHaveBeenCalledWith(
      [
        { label: '🚀 New', detail: '/projects/new', id: 'new' },
        { label: 'Old', detail: '/projects/one', id: 'old' },
        { label: 'Empty', detail: '', id: 'empty' },
      ],
      {
        placeHolder: 'Select a workspace to open',
        matchOnDescription: true,
        matchOnDetail: true,
      },
    );
  });

  it('opens the selected workspace', async () => {
    const { service, openService, fake } = setup([buildWorkspace()]);
    fake.showQuickPick.mockImplementation(async (items) => items[0]);

    await service.switch();

    expect(openService.open).toHaveBeenCalledWith('ws-1');
  });

  it('does nothing when the quick pick is cancelled', async () => {
    const { service, openService } = setup([buildWorkspace()]);

    await service.switch();

    expect(openService.open).not.toHaveBeenCalled();
  });
});
