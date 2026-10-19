import { describe, expect, it, vi } from 'vitest';
import type { WorkspaceStateManager } from '../../infra/persistence/WorkspaceStateManager';
import { buildUserInteraction } from '../../test/unit/fakes';
import { Uri } from '../../test/unit/mocks/vscode';
import { OpenWorkspacesFileService } from './OpenWorkspacesFileService';

function setup(getStorageUri: () => Uri) {
  const stateManager = { getStorageUri: vi.fn(getStorageUri) };
  const { fake, userInteraction } = buildUserInteraction();
  const service = new OpenWorkspacesFileService(
    stateManager as unknown as WorkspaceStateManager,
    userInteraction,
  );
  return { service, fake };
}

describe('OpenWorkspacesFileService', () => {
  it('opens the storage file in the editor', async () => {
    const uri = Uri.file('/config/workspaces.json');
    const { service, fake } = setup(() => uri);

    await service.open();

    expect(fake.openTextDocument).toHaveBeenCalledWith(uri);
    expect(fake.showError).not.toHaveBeenCalled();
  });

  it('shows an error when the file cannot be opened', async () => {
    const { service, fake } = setup(() => Uri.file('/config/workspaces.json'));
    fake.openTextDocument.mockRejectedValue(new Error('permission denied'));

    await service.open();

    expect(fake.showError).toHaveBeenCalledWith(
      'Failed to open workspaces.json: permission denied',
    );
  });

  it('shows non-error rejections as text', async () => {
    const { service, fake } = setup(() => Uri.file('/config/workspaces.json'));
    fake.openTextDocument.mockRejectedValue('boom');

    await service.open();

    expect(fake.showError).toHaveBeenCalledWith(
      'Failed to open workspaces.json: boom',
    );
  });
});
