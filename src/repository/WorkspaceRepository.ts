import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { Workspace } from '../dto/Workspace';
import { FileHelper } from '../helper/FileHelper';

export class WorkspaceRepository {
  private static readonly STORAGE_KEY = 'savedProjects';
  private storageUri!: vscode.Uri;
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.updateStorageUri();

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('workspaceManager.storagePath')) {
          this.updateStorageUri();
          this._onDidChange.fire();
        }
      }),
    );

    if (context.globalState.setKeysForSync) {
      context.globalState.setKeysForSync([WorkspaceRepository.STORAGE_KEY]);
    }
  }

  private getDefaultStoragePath(): string {
    const home = os.homedir();
    let dir: string;
    switch (process.platform) {
      case 'win32':
        dir = path.join(
          process.env.APPDATA || path.join(home, 'AppData', 'Roaming'),
          'parable-workspaces',
        );
        break;
      case 'darwin':
        dir = path.join(
          home,
          'Library',
          'Application Support',
          'parable-workspaces',
        );
        break;
      default:
        dir = path.join(
          process.env.XDG_CONFIG_HOME || path.join(home, '.config'),
          'parable-workspaces',
        );
        break;
    }
    return path.join(dir, 'workspaces.json');
  }

  private getTargetPath(): string {
    const config = vscode.workspace.getConfiguration('workspaceManager');
    let customPath = config.get<string>('storagePath');
    if (customPath) {
      customPath = customPath.trim();
      if (customPath.startsWith('~')) {
        customPath = path.join(os.homedir(), customPath.slice(1));
      }
      if (customPath.endsWith('.json')) {
        return customPath;
      }
      return path.join(customPath, 'workspaces.json');
    }
    return this.getDefaultStoragePath();
  }

  private updateStorageUri(): void {
    const targetPath = this.getTargetPath();
    this.storageUri = vscode.Uri.file(targetPath);

    const targetDir = path.dirname(targetPath);
    FileHelper.mkdir(targetDir);

    if (!FileHelper.exists(targetPath)) {
      const interimPath = path.join(
        os.homedir(),
        '.config',
        'parable-workspaces',
        'workspaces.json',
      );
      const legacyPath = path.join(
        this.context.globalStorageUri.fsPath,
        'workspaces.json',
      );

      if (FileHelper.exists(interimPath) && interimPath !== targetPath) {
        try {
          FileHelper.writeText(targetPath, FileHelper.readText(interimPath));
        } catch (e) {
          console.error(e);
        }
      } else if (FileHelper.exists(legacyPath) && legacyPath !== targetPath) {
        try {
          FileHelper.writeText(targetPath, FileHelper.readText(legacyPath));
        } catch (e) {
          console.error(e);
        }
      } else {
        this.syncFromFileSystem();
      }
    }
  }

  private syncFromFileSystem(): void {
    const stateData = this.context.globalState.get<Workspace[]>(
      WorkspaceRepository.STORAGE_KEY,
    );
    if (stateData && !FileHelper.exists(this.storageUri.fsPath)) {
      FileHelper.writeText(
        this.storageUri.fsPath,
        JSON.stringify(stateData, null, 2),
      );
    }
  }

  getStoragePath(): string {
    return path.dirname(this.storageUri.fsPath);
  }

  getStorageUri(): vscode.Uri {
    return this.storageUri;
  }

  getAll(): Workspace[] {
    if (FileHelper.exists(this.storageUri.fsPath)) {
      try {
        const content = FileHelper.readText(this.storageUri.fsPath);
        return JSON.parse(content);
      } catch (e) {
        console.error(
          'Error reading workspaces file, falling back to globalState',
          e,
        );
      }
    }
    return this.context.globalState.get<Workspace[]>(
      WorkspaceRepository.STORAGE_KEY,
      [],
    );
  }

  async save(workspace: Workspace): Promise<void> {
    const workspaces = this.getAll();
    const index = workspaces.findIndex((w) => w.id === workspace.id);
    if (index >= 0) {
      workspaces[index] = workspace;
    } else {
      workspaces.push(workspace);
    }

    FileHelper.writeText(
      this.storageUri.fsPath,
      JSON.stringify(workspaces, null, 2),
    );
    await this.context.globalState.update(
      WorkspaceRepository.STORAGE_KEY,
      workspaces,
    );
    this._onDidChange.fire();
  }

  async saveAll(newWorkspaces: Workspace[]): Promise<void> {
    const workspaces = this.getAll();
    for (const workspace of newWorkspaces) {
      const index = workspaces.findIndex((w) => w.id === workspace.id);
      if (index >= 0) {
        workspaces[index] = workspace;
      } else {
        workspaces.push(workspace);
      }
    }

    FileHelper.writeText(
      this.storageUri.fsPath,
      JSON.stringify(workspaces, null, 2),
    );
    await this.context.globalState.update(
      WorkspaceRepository.STORAGE_KEY,
      workspaces,
    );
    this._onDidChange.fire();
  }

  async delete(workspaceId: string): Promise<void> {
    const workspaces = this.getAll().filter((w) => w.id !== workspaceId);
    FileHelper.writeText(
      this.storageUri.fsPath,
      JSON.stringify(workspaces, null, 2),
    );
    await this.context.globalState.update(
      WorkspaceRepository.STORAGE_KEY,
      workspaces,
    );
    this._onDidChange.fire();
  }

  async updateLastOpened(workspaceId: string): Promise<void> {
    const workspaces = this.getAll();
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      workspace.lastOpened = Date.now();
      FileHelper.writeText(
        this.storageUri.fsPath,
        JSON.stringify(workspaces, null, 2),
      );
      await this.context.globalState.update(
        WorkspaceRepository.STORAGE_KEY,
        workspaces,
      );
      this._onDidChange.fire();
    }
  }
}
