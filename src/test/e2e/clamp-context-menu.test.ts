import * as assert from 'assert';
import { createRequire } from 'module';
import { join } from 'path';
import * as vscode from 'vscode';

const nodeRequire = createRequire(__filename);

suite('Clamp context menu E2E', () => {
  test('activates with the workspaces sidebar contribution', async () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension);
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
    assert.ok(
      extension.packageJSON?.contributes?.views?.parableWorkspacesContainer,
    );
  });

  test('ships clampContextMenuPosition in the webview context menu script', async () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension);
    await extension.activate();

    const { clampContextMenuPosition } = nodeRequire(
      join(extension.extensionPath, 'src/infra/view/js/contextMenu.js'),
    );
    assert.strictEqual(typeof clampContextMenuPosition, 'function');
    assert.deepStrictEqual(
      clampContextMenuPosition(350, 500, 160, 220, 400, 600),
      { left: 236, top: 376 },
    );
  });
});
