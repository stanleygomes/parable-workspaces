import { vi } from 'vitest';
import type { ExtensionContext } from 'vscode';
import type { Workspace } from '../../core/dtos/Workspace';
import { WorkspaceRepository } from '../../core/repositories/WorkspaceRepository';
import type { WorkspaceStateManager } from '../../infra/persistence/WorkspaceStateManager';
import type { UserInteraction } from '../../infra/editor/UserInteraction';
import { Uri } from './mocks/vscode';

export function buildWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: 'ws-1',
    name: 'Workspace One',
    folders: ['/projects/one'],
    tags: [],
    lastOpened: 0,
    ...overrides,
  };
}

export class InMemoryWorkspaceStateManager {
  public workspaces: Workspace[];

  constructor(initial: Workspace[] = []) {
    this.workspaces = structuredClone(initial);
  }

  read(): Workspace[] {
    return structuredClone(this.workspaces);
  }

  async write(workspaces: Workspace[]): Promise<void> {
    this.workspaces = structuredClone(workspaces);
  }

  getStorageUri(): Uri {
    return Uri.file('/config/parable-workspaces/workspaces.json');
  }
}

export function buildRepository(initial: Workspace[] = []) {
  const stateManager = new InMemoryWorkspaceStateManager(initial);
  const repository = new WorkspaceRepository(
    stateManager as unknown as WorkspaceStateManager,
  );
  return { stateManager, repository };
}

export function buildUserInteraction() {
  const fake = {
    showInputBox: vi.fn(),
    showConfirmation: vi.fn(),
    showQuickPick: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    executeCommand: vi.fn(),
    showOpenDialog: vi.fn(),
    showSaveDialog: vi.fn(),
    openTextDocument: vi.fn(),
    openFolder: vi.fn(),
  };
  return { fake, userInteraction: fake as unknown as UserInteraction };
}

export class FakeMemento {
  private readonly store = new Map<string, unknown>();
  public readonly setKeysForSync = vi.fn();

  constructor(initial: Record<string, unknown> = {}) {
    Object.entries(initial).forEach(([key, value]) =>
      this.store.set(key, value),
    );
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.store.has(key) ? (this.store.get(key) as T) : defaultValue;
  }

  async update(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
  }

  keys(): readonly string[] {
    return [...this.store.keys()];
  }
}

export function buildExtensionContext(
  options: { globalState?: FakeMemento; globalStoragePath?: string } = {},
) {
  const context = {
    subscriptions: [] as { dispose(): void }[],
    globalState: options.globalState ?? new FakeMemento(),
    globalStorageUri: Uri.file(options.globalStoragePath ?? '/global-storage'),
    extensionUri: Uri.file(process.cwd()),
  };
  return { context, extensionContext: context as unknown as ExtensionContext };
}

export class GlobalStateWorkspaceStateManager {
  static readonly STORAGE_KEY = 'savedProjects';

  constructor(private readonly context: ExtensionContext) {}

  read(): Workspace[] {
    return structuredClone(
      this.context.globalState.get<Workspace[]>(
        GlobalStateWorkspaceStateManager.STORAGE_KEY,
        [],
      ),
    );
  }

  async write(workspaces: Workspace[]): Promise<void> {
    await this.context.globalState.update(
      GlobalStateWorkspaceStateManager.STORAGE_KEY,
      structuredClone(workspaces),
    );
  }

  getStorageUri(): Uri {
    return Uri.file('/config/parable-workspaces/workspaces.json');
  }
}
