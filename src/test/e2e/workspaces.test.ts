import * as assert from 'assert';
import * as vscode from 'vscode';
import type { Container } from '../../container';
import { SettingsKey } from '../../core/enums/SettingsKey';
import { SortType } from '../../core/enums/SortType';
import {
  activateExtension,
  buildWorkspace,
  currentFolder,
  currentWorkspaceId,
  readStorageFile,
  resetStorage,
  sandboxedStoragePath,
  waitFor,
} from './helpers';

suite('Workspace management', () => {
  let container: Container;

  suiteSetup(async () => {
    container = await activateExtension();
  });

  setup(async () => {
    await resetStorage(container);
  });

  suiteTeardown(async () => {
    await resetStorage(container);
    await container.editorTheme.applyColor(undefined, undefined);
  });

  test('saves the current folder through the command', async () => {
    await vscode.commands.executeCommand('workspaceManager.saveProject');

    const saved = container.workspaceRepository.findOne(currentWorkspaceId());
    assert.ok(saved, 'Current workspace should be saved');
    assert.strictEqual(saved.name, currentFolder().name);
    assert.deepStrictEqual(saved.folders, [currentFolder().uri.fsPath]);
    assert.deepStrictEqual(
      readStorageFile(container).map((ws) => ws.id),
      [currentWorkspaceId()],
    );
  });

  test('saving twice keeps a single entry', async () => {
    await vscode.commands.executeCommand('workspaceManager.saveProject');
    await vscode.commands.executeCommand('workspaceManager.saveProject');

    assert.strictEqual(container.workspaceRepository.findAll().length, 1);
  });

  test('opens workspaces.json in the editor', async () => {
    await container.workspaceRepository.save(buildWorkspace());

    await vscode.commands.executeCommand('workspaceManager.openConfigFile');

    await waitFor(
      () =>
        vscode.window.activeTextEditor?.document.uri.fsPath ===
        sandboxedStoragePath(container),
    );
    assert.ok(
      vscode.window.activeTextEditor?.document
        .getText()
        .includes('E2E Workspace'),
    );
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  test('lists saved workspaces in a quick pick that can be dismissed', async () => {
    await container.workspaceRepository.save(buildWorkspace());

    const pending = vscode.commands.executeCommand(
      'workspaceManager.listProjects',
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    await vscode.commands.executeCommand('workbench.action.closeQuickOpen');
    await pending;

    assert.strictEqual(container.workspaceRepository.findAll().length, 1);
  });

  test('ignores opening an unknown workspace id', async () => {
    await vscode.commands.executeCommand(
      'workspaceManager.openWorkspace',
      'does-not-exist',
    );

    assert.deepStrictEqual(container.workspaceRepository.findAll(), []);
  });

  test('persists favorites to the storage file', async () => {
    await container.workspaceRepository.save(buildWorkspace());

    await container.UpdateWorkspaceFavoriteService.toggle('e2e-workspace');

    assert.strictEqual(readStorageFile(container)[0].isFavorite, true);
  });

  test('searches saved workspaces', async () => {
    await container.workspaceRepository.save(buildWorkspace());
    await container.workspaceRepository.save(
      buildWorkspace({ id: 'other', name: 'Another Project' }),
    );

    const found = container.FindWorkspaceService.search('another');

    assert.deepStrictEqual(
      found.map((ws) => ws.id),
      ['other'],
    );
  });

  test('deletes workspaces from the storage file', async () => {
    await container.workspaceRepository.save(buildWorkspace());

    await container.workspaceRepository.delete('e2e-workspace');

    assert.deepStrictEqual(readStorageFile(container), []);
  });

  test('applies and clears the workspace color in the editor settings', async () => {
    const colors = () =>
      vscode.workspace
        .getConfiguration('workbench')
        .get<Record<string, string>>('colorCustomizations') ?? {};

    await container.editorTheme.applyColor('#e74c3c', '#ffffff');
    assert.strictEqual(colors()['statusBar.background'], '#e74c3c');

    await container.editorTheme.applyColor(undefined, undefined);
    assert.strictEqual(colors()['statusBar.background'], undefined);
  });

  test('persists sidebar settings', async () => {
    await container.SettingsStateManager.set(
      SettingsKey.SortType,
      SortType.Alphabetical,
    );

    assert.strictEqual(
      container.SettingsStateManager.get(
        SettingsKey.SortType,
        SortType.FavoritesFirst,
      ),
      SortType.Alphabetical,
    );
    await container.SettingsStateManager.set(
      SettingsKey.SortType,
      SortType.FavoritesFirst,
    );
  });
});
