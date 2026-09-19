import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension E2E', () => {
  test('activates the extension', async () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension, 'Extension should be present');
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  test('registers the List/Open Workspaces command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('workspaceManager.listProjects'));
  });

  test('registers the workspaces sidebar view contribution', () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension);
    const views = extension.packageJSON?.contributes?.views;
    assert.ok(views?.parableWorkspacesContainer);
  });
});
