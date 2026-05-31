import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { WorkspaceRepository } from '../../repository/WorkspaceRepository';
import { StatusBarService } from '../../service/StatusBarService';
import { ExtensionContextMock } from '../repository/mocks/ExtensionContextMock';

suite('StatusBarService Test Suite', () => {
  let contextMock: ExtensionContextMock;
  let tempStorageDir: string;
  let repository: WorkspaceRepository;
  let originalCreateStatusBarItem: any;
  let originalWorkspaceFolders: any;
  let mockStatusBarItem: any;
  let mockWorkspaceFolders: any;

  suiteSetup(() => {
    tempStorageDir = path.join(
      os.tmpdir(),
      'parable-status-bar-test-' + Date.now(),
    );
    fs.mkdirSync(tempStorageDir, { recursive: true });

    originalCreateStatusBarItem = vscode.window.createStatusBarItem;
    originalWorkspaceFolders = vscode.workspace.workspaceFolders;
  });

  suiteTeardown(() => {
    if (fs.existsSync(tempStorageDir)) {
      fs.rmSync(tempStorageDir, { recursive: true, force: true });
    }
    vscode.window.createStatusBarItem = originalCreateStatusBarItem;
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: originalWorkspaceFolders,
      configurable: true,
    });
  });

  setup(() => {
    contextMock = new ExtensionContextMock(
      path.join(tempStorageDir, 'global-storage'),
    );
    repository = new WorkspaceRepository(contextMock as any);

    mockStatusBarItem = {
      text: '',
      tooltip: '',
      command: '',
      visible: false,
      show: function () {
        this.visible = true;
      },
      hide: function () {
        this.visible = false;
      },
      dispose: () => {},
    };

    vscode.window.createStatusBarItem = () => mockStatusBarItem;
  });

  test('should show status bar with listProjects command when current workspace is saved with emoji', async () => {
    const workspacePath = path.join(tempStorageDir, 'workspace1');
    fs.mkdirSync(workspacePath, { recursive: true });

    const folderUri = vscode.Uri.file(workspacePath);
    mockWorkspaceFolders = [{ uri: folderUri, name: 'workspace1', index: 0 }];

    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: mockWorkspaceFolders,
      configurable: true,
    });

    const workspaceId = Buffer.from(folderUri.fsPath).toString('base64');
    await repository.save({
      id: workspaceId,
      name: 'My Workspace',
      emoji: '⭐',
      folders: [folderUri.fsPath],
      color: '',
      isFavorite: false,
      lastOpened: Date.now(),
      tags: [],
    });

    const service = new StatusBarService(repository);
    service.update();

    assert.strictEqual(mockStatusBarItem.text, '⭐ My Workspace');
    assert.strictEqual(
      mockStatusBarItem.tooltip,
      'Current Workspace: My Workspace',
    );
    assert.strictEqual(
      mockStatusBarItem.command,
      'workspaceManager.listProjects',
    );
    assert.strictEqual(mockStatusBarItem.visible, true);

    service.dispose();
  });

  test('should hide status bar when current workspace has no emoji', async () => {
    const workspacePath = path.join(tempStorageDir, 'workspace2');
    fs.mkdirSync(workspacePath, { recursive: true });

    const folderUri = vscode.Uri.file(workspacePath);
    mockWorkspaceFolders = [{ uri: folderUri, name: 'workspace2', index: 0 }];

    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: mockWorkspaceFolders,
      configurable: true,
    });

    const workspaceId = Buffer.from(folderUri.fsPath).toString('base64');
    await repository.save({
      id: workspaceId,
      name: 'No Emoji Workspace',
      emoji: '',
      folders: [folderUri.fsPath],
      color: '',
      isFavorite: false,
      lastOpened: Date.now(),
      tags: [],
    });

    const service = new StatusBarService(repository);
    service.update();

    assert.strictEqual(mockStatusBarItem.visible, false);

    service.dispose();
  });
});
