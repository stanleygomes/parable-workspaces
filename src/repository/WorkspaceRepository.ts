import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { Workspace } from '../dto/Workspace';
import { FileHelper } from '../core/helpers/FileHelper';
import { OSHelper } from '../core/helpers/OSHelper';
import { WorkspaceFileStorage } from './WorkspaceFileStorage';
import { WorkspaceStateStorage } from '../editor/state/WorkspaceStateStorage';

export class WorkspaceRepository {
  private readonly fileStorage: WorkspaceFileStorage;
  private readonly stateStorage: WorkspaceStateStorage;
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    const targetPath = OSHelper.getDefaultConfigPath();
    this.fileStorage = new WorkspaceFileStorage(targetPath);
    this.stateStorage = new WorkspaceStateStorage(context);

    this.initializeStorage(targetPath);
  }

  private initializeStorage(targetPath: string): void {
    if (!this.fileStorage.exists()) {
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
          console.error('Error migrating from interim path', e);
        }
      } else if (FileHelper.exists(legacyPath) && legacyPath !== targetPath) {
        try {
          FileHelper.writeText(targetPath, FileHelper.readText(legacyPath));
        } catch (e) {
          console.error('Error migrating from legacy path', e);
        }
      } else {
        this.syncFromFileSystem();
      }
    }
  }

  private syncFromFileSystem(): void {
    const stateData = this.stateStorage.read();
    if (stateData.length > 0 && !this.fileStorage.exists()) {
      this.fileStorage.write(stateData);
    }
  }

  getStoragePath(): string {
    return this.fileStorage.getDirectoryPath();
  }

  getStorageUri(): vscode.Uri {
    return vscode.Uri.file(this.fileStorage.getFilePath());
  }

  getAll(): Workspace[] {
    if (this.fileStorage.exists()) {
      const workspaces = this.fileStorage.read();
      if (workspaces.length > 0) {
        return workspaces;
      }
    }

    return this.stateStorage.read();
  }

  async save(workspace: Workspace): Promise<void> {
    const workspaces = this.getAll();
    const index = workspaces.findIndex((w) => w.id === workspace.id);
    if (index >= 0) {
      workspaces[index] = workspace;
    } else {
      workspaces.push(workspace);
    }

    this.fileStorage.write(workspaces);
    await this.stateStorage.write(workspaces);
    this._onDidChange.fire();
  }

  async delete(workspaceId: string): Promise<void> {
    const workspaces = this.getAll().filter((w) => w.id !== workspaceId);
    this.fileStorage.write(workspaces);
    await this.stateStorage.write(workspaces);
    this._onDidChange.fire();
  }

  async updateLastOpened(workspaceId: string): Promise<void> {
    const workspaces = this.getAll();
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      workspace.lastOpened = Date.now();
      this.fileStorage.write(workspaces);
      await this.stateStorage.write(workspaces);
      this._onDidChange.fire();
    }
  }
}
