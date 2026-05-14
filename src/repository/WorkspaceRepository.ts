import * as vscode from 'vscode';
import * as path from 'path';
import { Workspace } from '../dto/Workspace';
import { FileHelper } from '../helper/FileHelper';

export class WorkspaceRepository {
  private static readonly STORAGE_KEY = 'savedProjects';
  private readonly storageUri: vscode.Uri;
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.storageUri = vscode.Uri.joinPath(context.globalStorageUri, 'workspaces.json');
    
    // Ensure the global storage directory exists
    FileHelper.mkdir(context.globalStorageUri.fsPath);

    // Enable cloud sync for the globalState key
    if (context.globalState.setKeysForSync) {
      context.globalState.setKeysForSync([WorkspaceRepository.STORAGE_KEY]);
    }

    // Sync from globalState to file if file doesn't exist (first time or after sync)
    this.syncFromFileSystem();
  }

  private syncFromFileSystem(): void {
    const stateData = this.context.globalState.get<Workspace[]>(WorkspaceRepository.STORAGE_KEY);
    if (stateData && !FileHelper.exists(this.storageUri.fsPath)) {
      FileHelper.writeText(this.storageUri.fsPath, JSON.stringify(stateData, null, 2));
    }
  }

  getStoragePath(): string {
    return path.dirname(this.storageUri.fsPath);
  }

  getAll(): Workspace[] {
    if (FileHelper.exists(this.storageUri.fsPath)) {
      try {
        const content = FileHelper.readText(this.storageUri.fsPath);
        return JSON.parse(content);
      } catch (e) {
        console.error('Error reading workspaces file, falling back to globalState', e);
      }
    }
    return this.context.globalState.get<Workspace[]>(WorkspaceRepository.STORAGE_KEY, []);
  }

  async save(workspace: Workspace): Promise<void> {
    const workspaces = this.getAll();
    const index = workspaces.findIndex((w) => w.id === workspace.id);
    if (index >= 0) {
      workspaces[index] = workspace;
    } else {
      workspaces.push(workspace);
    }
    
    // Save to both file (for local visibility) and globalState (for cloud sync)
    FileHelper.writeText(this.storageUri.fsPath, JSON.stringify(workspaces, null, 2));
    await this.context.globalState.update(WorkspaceRepository.STORAGE_KEY, workspaces);
    this._onDidChange.fire();
  }


  async delete(workspaceId: string): Promise<void> {
    const workspaces = this.getAll().filter((w) => w.id !== workspaceId);
    FileHelper.writeText(this.storageUri.fsPath, JSON.stringify(workspaces, null, 2));
    await this.context.globalState.update(WorkspaceRepository.STORAGE_KEY, workspaces);
    this._onDidChange.fire();
  }


  async updateLastOpened(workspaceId: string): Promise<void> {
    const workspaces = this.getAll();
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      workspace.lastOpened = Date.now();
      FileHelper.writeText(this.storageUri.fsPath, JSON.stringify(workspaces, null, 2));
      await this.context.globalState.update(WorkspaceRepository.STORAGE_KEY, workspaces);
      this._onDidChange.fire();
    }
  }
}
