import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StringHelper } from '../helpers/StringHelper';
import { buildRepository, buildUserInteraction } from '../../test/unit/fakes';
import { setWorkspace } from '../../test/unit/mocks/vscode';
import { SaveWorkspaceService } from './SaveWorkspaceService';

const NOW = 1_700_000_000_000;

function setup() {
  const { repository, stateManager } = buildRepository();
  const { fake, userInteraction } = buildUserInteraction();
  const service = new SaveWorkspaceService(repository, userInteraction);
  return { service, stateManager, fake };
}

describe('SaveWorkspaceService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves the current folder as a workspace', async () => {
    setWorkspace(['/projects/parable']);
    const { service, stateManager, fake } = setup();

    await service.save();

    expect(stateManager.workspaces).toEqual([
      {
        id: StringHelper.toBase64('/projects/parable'),
        name: 'parable',
        folders: ['/projects/parable'],
        lastOpened: NOW,
        tags: [],
      },
    ]);
    expect(fake.showInfo).toHaveBeenCalledWith(
      'Workspace "parable" saved successfully!',
    );
  });

  it('saves every folder of a multi-root workspace', async () => {
    setWorkspace(['/projects/api', '/projects/web'], {
      workspaceFile: '/projects/full.code-workspace',
      name: 'Full Stack',
    });
    const { service, stateManager } = setup();

    await service.save();

    expect(stateManager.workspaces[0]).toMatchObject({
      id: StringHelper.toBase64('/projects/full.code-workspace'),
      name: 'Full Stack',
      folders: ['/projects/api', '/projects/web'],
    });
  });

  it('shows an error when no folder is open', async () => {
    const { service, stateManager, fake } = setup();

    await service.save();

    expect(stateManager.workspaces).toEqual([]);
    expect(fake.showError).toHaveBeenCalledWith('No folder open to save.');
  });
});
