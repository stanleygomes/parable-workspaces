import * as vscode from 'vscode';
import { Workspace } from '../dto/Workspace';

export class WorkspaceRepository {
  private static readonly STORAGE_KEY = 'savedProjects';

  constructor(private readonly context: vscode.ExtensionContext) {
    // Enable cloud sync for this key, so projects follow the user
    if (context.globalState.setKeysForSync) {
      context.globalState.setKeysForSync([WorkspaceRepository.STORAGE_KEY]);
    }
  }

  getAll(): Workspace[] {
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
    await this.context.globalState.update(WorkspaceRepository.STORAGE_KEY, workspaces);
  }

  async delete(workspaceId: string): Promise<void> {
    const workspaces = this.getAll().filter((w) => w.id !== workspaceId);
    await this.context.globalState.update(
      WorkspaceRepository.STORAGE_KEY,
      workspaces,
    );
  }

  async updateLastOpened(workspaceId: string): Promise<void> {
    const workspaces = this.getAll();
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      workspace.lastOpened = Date.now();
      await this.context.globalState.update(
        WorkspaceRepository.STORAGE_KEY,
        workspaces,
      );
    }
  }
}
