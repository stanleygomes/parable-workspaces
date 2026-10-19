import { describe, expect, it, vi } from 'vitest';
import { StringHelper } from '../helpers/StringHelper';
import type { EditorStatusBar } from '../../infra/editor/EditorStatusBar';
import { buildRepository, buildWorkspace } from '../../test/unit/fakes';
import {
  setWorkspace,
  workspaceFoldersEmitter,
} from '../../test/unit/mocks/vscode';
import type { Workspace } from '../dtos/Workspace';
import { UpdateWorkspaceStatusBarService } from './UpdateWorkspaceStatusBarService';

const CURRENT_ID = StringHelper.toBase64('/projects/current');

function setup(initial: Workspace[]) {
  const { repository } = buildRepository(initial);
  const subscription = { dispose: vi.fn() };
  const statusBar = {
    update: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
    onDidChangeWorkspaceFolders: vi.fn((callback: () => void) => {
      workspaceFoldersEmitter.event(callback);
      return subscription;
    }),
  };
  const service = new UpdateWorkspaceStatusBarService(
    repository,
    statusBar as unknown as EditorStatusBar,
  );
  return { service, repository, statusBar, subscription };
}

describe('UpdateWorkspaceStatusBarService', () => {
  it('hides the status bar without an open folder', () => {
    const { statusBar } = setup([]);

    expect(statusBar.hide).toHaveBeenCalled();
    expect(statusBar.update).not.toHaveBeenCalled();
  });

  it('hides the status bar for workspaces without emoji', () => {
    setWorkspace(['/projects/current']);
    const { statusBar } = setup([buildWorkspace({ id: CURRENT_ID })]);

    expect(statusBar.hide).toHaveBeenCalled();
  });

  it('shows the emoji and name of the current workspace', () => {
    setWorkspace(['/projects/current']);
    const { statusBar } = setup([
      buildWorkspace({ id: CURRENT_ID, name: 'Current', emoji: '🚀' }),
    ]);

    expect(statusBar.update).toHaveBeenCalledWith(
      '🚀 Current',
      'Current Workspace: Current',
      'workspaceManager.listProjects',
    );
  });

  it('refreshes when the repository changes', async () => {
    setWorkspace(['/projects/current']);
    const { repository, statusBar } = setup([
      buildWorkspace({ id: CURRENT_ID, name: 'Current' }),
    ]);

    await repository.save(
      buildWorkspace({ id: CURRENT_ID, name: 'Current', emoji: '✨' }),
    );

    expect(statusBar.update).toHaveBeenCalledWith(
      '✨ Current',
      'Current Workspace: Current',
      'workspaceManager.listProjects',
    );
  });

  it('refreshes when workspace folders change', () => {
    const { statusBar } = setup([
      buildWorkspace({ id: CURRENT_ID, name: 'Current', emoji: '🚀' }),
    ]);
    setWorkspace(['/projects/current']);

    workspaceFoldersEmitter.fire();

    expect(statusBar.update).toHaveBeenCalledOnce();
  });

  it('disposes its subscription and the status bar', () => {
    const { service, statusBar, subscription } = setup([]);

    service.dispose();

    expect(subscription.dispose).toHaveBeenCalled();
    expect(statusBar.dispose).toHaveBeenCalled();
  });
});
