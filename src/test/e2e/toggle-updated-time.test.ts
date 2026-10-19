import * as assert from 'assert';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';

suite('Toggle Updated time E2E', () => {
  test('activates the extension with filter-capable sidebar', async () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension);
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  test('ships the Updated filter chip in the sidebar filters template', async () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension);
    await extension.activate();

    const filtersHtml = readFileSync(
      join(extension.extensionPath, 'src/infra/view/html/filters.html'),
      'utf8',
    );
    assert.ok(filtersHtml.includes('id="btnShowTimeUpdated"'));
    assert.ok(filtersHtml.includes('filter-chip-label">Updated'));
  });

  test('wires toggleTimeUpdated through the webview controller', async () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension);

    const controller = readFileSync(
      join(extension.extensionPath, 'src/infra/view/js/controller.js'),
      'utf8',
    );
    assert.ok(controller.includes('toggleTimeUpdated'));
    assert.ok(controller.includes('updateFilterCompactMode'));
  });
});
