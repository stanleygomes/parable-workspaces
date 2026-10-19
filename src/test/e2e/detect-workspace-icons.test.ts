import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Detect workspace icons E2E', () => {
  test('registers parableWorkspaces.detectIcons defaulting to false', async () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension);
    await extension.activate();

    const properties =
      extension.packageJSON?.contributes?.configuration?.properties;
    assert.ok(properties?.['parableWorkspaces.detectIcons']);
    assert.strictEqual(
      properties['parableWorkspaces.detectIcons'].default,
      false,
    );
  });

  test('exposes detectIcons through the workspace configuration API', async () => {
    const value = vscode.workspace
      .getConfiguration('parableWorkspaces')
      .get('detectIcons');
    assert.strictEqual(value, false);
  });
});
