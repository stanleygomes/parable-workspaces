import * as assert from 'assert';
import * as vscode from 'vscode';

import { EditorContext } from '../../infra/editor/EditorContext';
import type { Workspace } from '../../core/dtos/Workspace';

suite('Open code-workspace E2E', () => {
  const baseWorkspace = (): Workspace => ({
    id: 'id',
    name: 'Demo',
    folders: ['/tmp/demo'],
    tags: [],
    lastOpened: 0,
  });

  test('activates the extension before opening workspaces', async () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension);
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  test('registers save and list commands used when switching', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('workspaceManager.saveProject'));
    assert.ok(commands.includes('workspaceManager.listProjects'));
  });

  test('resolveOpenPath prefers an explicit workspaceFile', () => {
    const workspace = {
      ...baseWorkspace(),
      workspaceFile: '/tmp/demo/app.code-workspace',
    };
    assert.strictEqual(
      EditorContext.resolveOpenPath(workspace),
      '/tmp/demo/app.code-workspace',
    );
  });

  test('resolveOpenPath recovers a .code-workspace id when workspaceFile is missing', () => {
    const workspaceFile = '/tmp/demo/app.code-workspace';
    const workspace = {
      ...baseWorkspace(),
      id: Buffer.from(workspaceFile).toString('base64'),
      folders: ['/tmp/demo'],
    };
    assert.strictEqual(EditorContext.resolveOpenPath(workspace), workspaceFile);
  });
});
