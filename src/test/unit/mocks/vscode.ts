import { vi } from 'vitest';

type Listener<T> = (event: T) => void;

export class Disposable {
  constructor(private readonly callOnDispose: () => void = () => {}) {}

  dispose(): void {
    this.callOnDispose();
  }
}

export class EventEmitter<T> {
  private listeners: Listener<T>[] = [];

  readonly event = (listener: Listener<T>): Disposable => {
    this.listeners.push(listener);
    return new Disposable(() => {
      this.listeners = this.listeners.filter((item) => item !== listener);
    });
  };

  fire(data?: T): void {
    [...this.listeners].forEach((listener) => listener(data as T));
  }

  dispose(): void {
    this.listeners = [];
  }
}

export class Uri {
  private constructor(public readonly fsPath: string) {}

  static file(path: string): Uri {
    return new Uri(path);
  }

  toString(): string {
    return `file://${this.fsPath}`;
  }
}

export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

export enum ConfigurationTarget {
  Global = 1,
  Workspace = 2,
  WorkspaceFolder = 3,
}

export interface FakeStatusBarItem {
  text: string;
  tooltip: string | undefined;
  command: string | undefined;
  show: ReturnType<typeof vi.fn>;
  hide: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}

export const configurationStore = new Map<string, unknown>();
export const statusBarItems: FakeStatusBarItem[] = [];
export const workspaceFoldersEmitter = new EventEmitter<unknown>();

function createStatusBarItem(): FakeStatusBarItem {
  const item: FakeStatusBarItem = {
    text: '',
    tooltip: undefined,
    command: undefined,
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  };
  statusBarItems.push(item);
  return item;
}

function getConfiguration(section: string) {
  const fullKey = (key: string) => `${section}.${key}`;
  return {
    get: <T>(key: string, defaultValue?: T) =>
      configurationStore.has(fullKey(key))
        ? (configurationStore.get(fullKey(key)) as T)
        : defaultValue,
    update: vi.fn(async (key: string, value: unknown) => {
      configurationStore.set(fullKey(key), value);
    }),
  };
}

export const window = {
  createStatusBarItem: vi.fn(createStatusBarItem),
  showInputBox: vi.fn(),
  showWarningMessage: vi.fn(),
  showQuickPick: vi.fn(),
  showErrorMessage: vi.fn(),
  showInformationMessage: vi.fn(),
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
  showTextDocument: vi.fn(),
  registerWebviewViewProvider: vi.fn(() => new Disposable()),
};

export const workspace = {
  workspaceFolders: undefined as
    | { uri: Uri; name: string; index: number }[]
    | undefined,
  workspaceFile: undefined as Uri | undefined,
  name: undefined as string | undefined,
  getConfiguration: vi.fn(getConfiguration),
  openTextDocument: vi.fn(async (uri: Uri) => ({ uri })),
  onDidChangeWorkspaceFolders: vi.fn((listener: Listener<unknown>) =>
    workspaceFoldersEmitter.event(listener),
  ),
};

export const commands = {
  registerCommand: vi.fn(
    (_command: string, _callback: (...args: unknown[]) => unknown) =>
      new Disposable(),
  ),
  executeCommand: vi.fn(),
};

export function setWorkspace(
  folders: string[],
  options: { workspaceFile?: string; name?: string } = {},
): void {
  workspace.workspaceFolders = folders.map((folder, index) => ({
    uri: Uri.file(folder),
    name: folder.split('/').filter(Boolean).pop() ?? folder,
    index,
  }));
  workspace.workspaceFile = options.workspaceFile
    ? Uri.file(options.workspaceFile)
    : undefined;
  workspace.name = options.name;
}

export function resetVscodeMock(): void {
  workspace.workspaceFolders = undefined;
  workspace.workspaceFile = undefined;
  workspace.name = undefined;
  configurationStore.clear();
  statusBarItems.length = 0;
  workspaceFoldersEmitter.dispose();
}
