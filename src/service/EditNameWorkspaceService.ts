import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';

export class EditNameWorkspaceService {
  constructor(private readonly repository: WorkspaceRepository) {}

  public async edit(workspaceId: string): Promise<void> {
    const workspace = this.repository
      .getAll()
      .find((w) => w.id === workspaceId);
    if (!workspace) {
      return;
    }

    const name = await vscode.window.showInputBox({
      prompt: 'Workspace Name',
      value: workspace.name,
    });

    if (name === undefined) return;

    workspace.name = name;
    await this.repository.save(workspace);
  }
}
