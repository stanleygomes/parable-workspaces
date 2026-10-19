import * as assert from 'assert';
import * as vscode from 'vscode';
import { EXTENSION_ID, activateExtension } from './helpers';

const CONTRIBUTED_COMMANDS = [
  'workspaceManager.saveProject',
  'workspaceManager.openConfigFile',
  'workspaceManager.refreshWorkspaces',
  'workspaceManager.listProjects',
];

suite('Extension activation', () => {
  test('activates and exposes the service container', async () => {
    const container = await activateExtension();

    assert.strictEqual(
      vscode.extensions.getExtension(EXTENSION_ID)?.isActive,
      true,
    );
    assert.ok(container.workspaceRepository);
  });

  test('registers every command', async () => {
    await activateExtension();
    const commands = await vscode.commands.getCommands(true);

    for (const command of [
      ...CONTRIBUTED_COMMANDS,
      'workspaceManager.openWorkspace',
    ]) {
      assert.ok(commands.includes(command), `${command} is not registered`);
    }
  });

  test('contributes commands, sidebar view and keybinding', () => {
    const packageJSON =
      vscode.extensions.getExtension(EXTENSION_ID)?.packageJSON;
    const contributes = packageJSON?.contributes;

    assert.deepStrictEqual(
      contributes.commands.map((c: { command: string }) => c.command),
      CONTRIBUTED_COMMANDS,
    );
    assert.strictEqual(
      contributes.views.parableWorkspacesContainer[0].id,
      'workspaceManager.workspacesView',
    );
    assert.strictEqual(
      contributes.keybindings[0].command,
      'workspaceManager.listProjects',
    );
  });

  test('opens the sidebar view', async () => {
    await activateExtension();

    await vscode.commands.executeCommand(
      'workbench.view.extension.parableWorkspacesContainer',
    );
    await vscode.commands.executeCommand('workspaceManager.refreshWorkspaces');
  });
});
