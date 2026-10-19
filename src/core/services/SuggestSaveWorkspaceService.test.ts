import { describe, expect, it, vi } from 'vitest';
import { StringHelper } from '../helpers/StringHelper';
import {
  buildRepository,
  buildUserInteraction,
  buildWorkspace,
} from '../../test/unit/fakes';
import { Uri, setWorkspace, workspace } from '../../test/unit/mocks/vscode';
import type { SaveWorkspaceService } from './SaveWorkspaceService';
import { SuggestSaveWorkspaceService } from './SuggestSaveWorkspaceService';

function setup(initial = [buildWorkspace()]) {
  const { repository } = buildRepository(initial);
  const { fake, userInteraction } = buildUserInteraction();
  const saveService = { save: vi.fn() };
  const service = new SuggestSaveWorkspaceService(
    repository,
    saveService as unknown as SaveWorkspaceService,
    userInteraction,
  );
  return { service, saveService, fake };
}

describe('SuggestSaveWorkspaceService', () => {
  it('does nothing without an open folder', async () => {
    const { service, fake } = setup();

    await service.suggest();

    expect(fake.showInfo).not.toHaveBeenCalled();
  });

  it('does nothing when the current workspace is already saved', async () => {
    setWorkspace(['/projects/parable']);
    const { service, fake } = setup([
      buildWorkspace({ id: StringHelper.toBase64('/projects/parable') }),
    ]);

    await service.suggest();

    expect(fake.showInfo).not.toHaveBeenCalled();
  });

  it('does nothing when the current folder has no name', async () => {
    workspace.workspaceFolders = [
      { uri: Uri.file('/projects/unnamed'), name: '', index: 0 },
    ];
    const { service, fake } = setup();

    await service.suggest();

    expect(fake.showInfo).not.toHaveBeenCalled();
  });

  it('saves when the user accepts the suggestion', async () => {
    setWorkspace(['/projects/parable']);
    const { service, saveService, fake } = setup();
    fake.showInfo.mockResolvedValue('Save Workspace');

    await service.suggest();

    expect(fake.showInfo).toHaveBeenCalledWith(
      'Would you like to save "parable" as a Workspace?',
      'Save Workspace',
      'Not Now',
    );
    expect(saveService.save).toHaveBeenCalledOnce();
  });

  it.each(['Not Now', undefined])(
    'does not save when the user answers %s',
    async (answer) => {
      setWorkspace(['/projects/parable']);
      const { service, saveService, fake } = setup();
      fake.showInfo.mockResolvedValue(answer);

      await service.suggest();

      expect(saveService.save).not.toHaveBeenCalled();
    },
  );
});
