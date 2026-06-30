import * as vscode from 'vscode';
import { Workspace } from '../dtos/Workspace';
import { WorkspaceStateManager } from '../persistence/WorkspaceStateManager';

export class WorkspaceRepository {
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  constructor(private readonly stateManager: WorkspaceStateManager) {}

  findAll(): Workspace[] {
    return this.stateManager.read();
  }

  findOne(id: string): Workspace | undefined {
    return this.findAll().find((w) => w.id === id);
  }

  async save(workspace: Workspace): Promise<void> {
    const workspaces = this.findAll();
    const index = workspaces.findIndex((w) => w.id === workspace.id);
    if (index >= 0) {
      workspaces[index] = workspace;
    } else {
      workspaces.push(workspace);
    }

    await this.stateManager.write(workspaces);
    this._onDidChange.fire();
  }

  async delete(workspaceId: string): Promise<void> {
    const workspaces = this.findAll().filter((w) => w.id !== workspaceId);
    await this.stateManager.write(workspaces);
    this._onDidChange.fire();
  }
}
