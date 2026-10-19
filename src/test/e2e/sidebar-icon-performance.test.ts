import * as assert from 'assert';
import * as vscode from 'vscode';

import { ViewProvider } from '../../infra/view/ViewProvider';

suite('Sidebar icon performance E2E', () => {
  test('activates with stable local resource roots for the icon cache', async () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension);
    await extension.activate();
    assert.strictEqual(extension.isActive, true);

    const extensionUri = extension.extensionUri;
    const cacheDir = '/tmp/parable-webview-icons-e2e';
    const first = ViewProvider.buildLocalResourceRoots(extensionUri, cacheDir);
    const second = ViewProvider.buildLocalResourceRoots(extensionUri, cacheDir);

    assert.strictEqual(first.length, 2);
    assert.strictEqual(first[0].fsPath, extensionUri.fsPath);
    assert.strictEqual(first[1].fsPath, cacheDir);
    assert.strictEqual(second[1].fsPath, first[1].fsPath);
  });

  test('keeps detectIcons opt-in while icon caching is available', () => {
    const value = vscode.workspace
      .getConfiguration('parableWorkspaces')
      .get('detectIcons');
    assert.strictEqual(value, false);
  });
});
