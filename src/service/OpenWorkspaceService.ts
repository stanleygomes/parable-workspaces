import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';

export class OpenWorkspaceService {
  constructor(private readonly repository: WorkspaceRepository) {}

  async open(id: string, forceNewWindow: boolean = false): Promise<void> {
    const workspaces = this.repository.getAll();
    const workspace = workspaces.find((w) => w.id === id);
    if (workspace) {
      await this.repository.updateLastOpened(workspace.id);
      const uri = vscode.Uri.file(workspace.folders[0]);
      vscode.commands.executeCommand('vscode.openFolder', uri, forceNewWindow);
    }
  }
}
