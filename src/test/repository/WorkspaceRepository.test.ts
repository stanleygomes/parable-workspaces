import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { WorkspaceRepository } from '../../repository/WorkspaceRepository';
import { ExtensionContextMock } from './mocks/ExtensionContextMock';

suite('WorkspaceRepository Test Suite', () => {
  let contextMock: ExtensionContextMock;
  let tempStorageDir: string;

  suiteSetup(() => {
    tempStorageDir = path.join(
      os.tmpdir(),
      'parable-test-storage-' + Date.now(),
    );
    fs.mkdirSync(tempStorageDir, { recursive: true });
  });

  suiteTeardown(() => {
    if (fs.existsSync(tempStorageDir)) {
      fs.rmSync(tempStorageDir, { recursive: true, force: true });
    }
  });

  setup(() => {
    contextMock = new ExtensionContextMock(
      path.join(tempStorageDir, 'global-storage'),
    );
  });

  teardown(async () => {
    const config = vscode.workspace.getConfiguration('workspaceManager');
    await config.update(
      'storagePath',
      undefined,
      vscode.ConfigurationTarget.Global,
    );
  });

  test('should resolve to custom path when configuration is set', async () => {
    const config = vscode.workspace.getConfiguration('workspaceManager');
    const customDir = path.join(tempStorageDir, 'custom-dir');

    await config.update(
      'storagePath',
      customDir,
      vscode.ConfigurationTarget.Global,
    );

    const repository = new WorkspaceRepository(contextMock as any);
    const resolvedPath = repository.getStoragePath();

    assert.strictEqual(resolvedPath, customDir);
  });

  test('should update storage path and notify when configuration changes', async () => {
    const repository = new WorkspaceRepository(contextMock as any);

    let eventFired = false;
    repository.onDidChange(() => {
      eventFired = true;
    });

    const config = vscode.workspace.getConfiguration('workspaceManager');
    const newCustomDir = path.join(tempStorageDir, 'dynamic-dir');

    await config.update(
      'storagePath',
      newCustomDir,
      vscode.ConfigurationTarget.Global,
    );

    await new Promise((resolve) => setTimeout(resolve, 200));

    assert.strictEqual(repository.getStoragePath(), newCustomDir);
    assert.strictEqual(eventFired, true);
  });
});
