import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FakeMemento,
  buildExtensionContext,
  buildWorkspace,
} from '../../test/unit/fakes';
import type { Workspace } from '../../core/dtos/Workspace';
import { WorkspaceStateManager } from './WorkspaceStateManager';

const fakeHome = vi.hoisted(() => ({ path: '' }));

vi.mock('os', async (importOriginal) => {
  const original = await importOriginal<typeof import('os')>();
  return { ...original, homedir: () => fakeHome.path };
});

const STORAGE_KEY = 'savedProjects';
const originalPlatform = process.platform;

describe('WorkspaceStateManager', () => {
  let sandbox: string;
  let targetPath: string;
  let interimPath: string;
  let globalStoragePath: string;

  const writeJson = (filePath: string, workspaces: Workspace[]) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(workspaces));
  };

  const readJson = (filePath: string): Workspace[] =>
    JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const create = (state: Record<string, unknown> = {}) => {
    const globalState = new FakeMemento(state);
    const { extensionContext } = buildExtensionContext({
      globalState,
      globalStoragePath,
    });
    return {
      manager: new WorkspaceStateManager(extensionContext),
      globalState,
    };
  };

  beforeEach(async () => {
    const realOs = await vi.importActual<typeof import('os')>('os');
    sandbox = fs.mkdtempSync(path.join(realOs.tmpdir(), 'parable-state-'));
    fakeHome.path = path.join(sandbox, 'home');
    globalStoragePath = path.join(sandbox, 'global-storage');
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.stubEnv('XDG_CONFIG_HOME', path.join(sandbox, 'xdg'));
    targetPath = path.join(
      sandbox,
      'xdg',
      'parable-workspaces',
      'workspaces.json',
    );
    interimPath = path.join(
      fakeHome.path,
      '.config',
      'parable-workspaces',
      'workspaces.json',
    );
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    vi.unstubAllEnvs();
    fs.rmSync(sandbox, { recursive: true, force: true });
  });

  it('registers the storage key for settings sync', () => {
    const { globalState } = create();

    expect(globalState.setKeysForSync).toHaveBeenCalledWith([STORAGE_KEY]);
  });

  it('does not create the file when there is nothing to store', () => {
    create();

    expect(fs.existsSync(targetPath)).toBe(false);
  });

  it('seeds the file from the global state', () => {
    const workspaces = [buildWorkspace()];

    create({ [STORAGE_KEY]: workspaces });

    expect(readJson(targetPath)).toEqual(workspaces);
  });

  it('migrates from the interim ~/.config location', () => {
    const workspaces = [buildWorkspace({ id: 'interim' })];
    writeJson(interimPath, workspaces);

    create();

    expect(readJson(targetPath)).toEqual(workspaces);
  });

  it('migrates from the legacy global storage location', () => {
    const workspaces = [buildWorkspace({ id: 'legacy' })];
    writeJson(path.join(globalStoragePath, 'workspaces.json'), workspaces);

    create();

    expect(readJson(targetPath)).toEqual(workspaces);
  });

  it.each([
    ['interim', () => interimPath],
    ['legacy', () => path.join(globalStoragePath, 'workspaces.json')],
  ])('survives unreadable %s files', (_label, sourcePath) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fs.mkdirSync(sourcePath(), { recursive: true });

    const { manager } = create();

    expect(console.error).toHaveBeenCalled();
    expect(manager.read()).toEqual([]);
  });

  it('keeps an existing file untouched', () => {
    const existing = [buildWorkspace({ id: 'existing' })];
    writeJson(targetPath, existing);
    writeJson(interimPath, [buildWorkspace({ id: 'interim' })]);

    create({ [STORAGE_KEY]: [buildWorkspace({ id: 'state' })] });

    expect(readJson(targetPath)).toEqual(existing);
  });

  it('reads from the file first', () => {
    writeJson(targetPath, [buildWorkspace({ id: 'file' })]);
    const { manager } = create({
      [STORAGE_KEY]: [buildWorkspace({ id: 'state' })],
    });

    expect(manager.read().map((ws) => ws.id)).toEqual(['file']);
  });

  it('falls back to the global state when the file is empty', () => {
    writeJson(targetPath, []);
    const { manager } = create({
      [STORAGE_KEY]: [buildWorkspace({ id: 'state' })],
    });

    expect(manager.read().map((ws) => ws.id)).toEqual(['state']);
  });

  it('writes to both the file and the global state', async () => {
    const { manager, globalState } = create();
    const workspaces = [buildWorkspace({ id: 'written' })];

    await manager.write(workspaces);

    expect(readJson(targetPath)).toEqual(workspaces);
    expect(globalState.get(STORAGE_KEY)).toEqual(workspaces);
  });

  it('exposes the storage location', () => {
    const { manager } = create();

    expect(manager.getStoragePath()).toBe(path.dirname(targetPath));
    expect(manager.getStorageUri().fsPath).toBe(targetPath);
  });
});
