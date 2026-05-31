import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';

export class StatusBarService {
  private statusBarItem: vscode.StatusBarItem;

  constructor(private readonly repository: WorkspaceRepository) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.repository.onDidChange(() => this.update());
    vscode.workspace.onDidChangeWorkspaceFolders(() => this.update());
    this.update();
  }

  public update(): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      this.statusBarItem.hide();
      return;
    }

    const primaryFolder = workspaceFolders[0];
    const workspaceFile = vscode.workspace.workspaceFile;
    const currentId = Buffer.from(
      workspaceFile?.fsPath || primaryFolder.uri.fsPath,
    ).toString('base64');

    const workspace = this.repository.getAll().find((w) => w.id === currentId);

    if (workspace && workspace.emoji) {
      this.statusBarItem.text = `${workspace.emoji} ${workspace.name}`;
      this.statusBarItem.tooltip = `Current Workspace: ${workspace.name}`;
      this.statusBarItem.command = 'workspaceManager.listProjects';
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
