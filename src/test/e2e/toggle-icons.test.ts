import * as assert from 'assert';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';

suite('Toggle Icons chip E2E', () => {
  test('activates with Icons filter chip markup', async () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension);
    await extension.activate();
    assert.strictEqual(extension.isActive, true);

    const filtersHtml = readFileSync(
      join(extension.extensionPath, 'src/infra/view/html/filters.html'),
      'utf8',
    );
    assert.ok(filtersHtml.includes('id="btnShowFavicon"'));
    assert.ok(filtersHtml.includes('filter-chip-label">Icons'));
  });

  test('wires showFavicon toggle without mutating detectIcons config', async () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension);

    const controller = readFileSync(
      join(extension.extensionPath, 'src/infra/view/js/controller.js'),
      'utf8',
    );
    const renderer = readFileSync(
      join(extension.extensionPath, 'src/infra/view/js/renderer.js'),
      'utf8',
    );

    assert.ok(controller.includes('toggleShowFavicon'));
    assert.ok(renderer.includes('filters?.showFavicon !== false'));
    assert.ok(renderer.includes('no-icons'));
    assert.strictEqual(
      vscode.workspace.getConfiguration('parableWorkspaces').get('detectIcons'),
      false,
    );
  });
});
