import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type { Container } from '../../container';
import type { Workspace } from '../../core/dtos/Workspace';

export const EXTENSION_ID = 'stanleygomes.parable-workspaces';

export async function activateExtension(): Promise<Container> {
  const extension = vscode.extensions.getExtension<Container>(EXTENSION_ID);
  assert.ok(extension, 'Extension should be present');
  return extension.activate();
}

export function sandboxedStoragePath(container: Container): string {
  const configHome = process.env.PARABLE_E2E_CONFIG_HOME;
  const storagePath = container.workspaceStateManager.getStorageUri().fsPath;
  assert.ok(
    configHome && storagePath.startsWith(configHome),
    `Refusing to run: storage ${storagePath} is outside the e2e sandbox`,
  );
  return storagePath;
}

export async function resetStorage(container: Container): Promise<void> {
  sandboxedStoragePath(container);
  await container.workspaceStateManager.write([]);
}

export function readStorageFile(container: Container): Workspace[] {
  return JSON.parse(fs.readFileSync(sandboxedStoragePath(container), 'utf8'));
}

export function currentFolder(): vscode.WorkspaceFolder {
  const folder = vscode.workspace.workspaceFolders?.[0];
  assert.ok(folder, 'E2E tests require an open workspace folder');
  return folder;
}

export function currentWorkspaceId(): string {
  return Buffer.from(currentFolder().uri.fsPath).toString('base64');
}

export function buildWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: 'e2e-workspace',
    name: 'E2E Workspace',
    folders: [path.join(currentFolder().uri.fsPath, 'other')],
    tags: [],
    lastOpened: Date.now(),
    ...overrides,
  };
}

export async function waitFor(
  condition: () => boolean,
  timeoutMs = 5000,
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timed out waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
