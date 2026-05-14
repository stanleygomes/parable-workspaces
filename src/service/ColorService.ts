import * as vscode from 'vscode';
import { Workspace } from '../dto/Workspace';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';

export class ColorService {
  constructor(private readonly repository: WorkspaceRepository) {}

  public async applyCurrentWorkspaceColor(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return;

    const primaryFolder = workspaceFolders[0];
    const workspaceFile = vscode.workspace.workspaceFile;
    const currentId = Buffer.from(
      workspaceFile?.fsPath || primaryFolder.uri.fsPath,
    ).toString('base64');

    const workspace = this.repository.getAll().find((w) => w.id === currentId);
    if (workspace && workspace.color) {
      await this.applyColor(workspace.color);
    }
  }

  public async applyColor(color: string | undefined): Promise<void> {
    const config = vscode.workspace.getConfiguration('workbench');
    const customizations = config.get<any>('colorCustomizations') || {};

    if (!color) {
      // Remove customizations if they were set by us
      // Note: This might remove customizations set by other extensions or the user manually
      // but usually Peacock/Color Scheme extensions own these keys.
      delete customizations['activityBar.background'];
      delete customizations['activityBar.foreground'];
      delete customizations['titleBar.activeBackground'];
      delete customizations['titleBar.activeForeground'];
      delete customizations['statusBar.background'];
      delete customizations['statusBar.foreground'];
    } else {
      // Apply Peacock-like customizations
      customizations['activityBar.background'] = color;
      customizations['activityBar.foreground'] = '#ffffff';
      customizations['titleBar.activeBackground'] = color;
      customizations['titleBar.activeForeground'] = '#ffffff';
      customizations['statusBar.background'] = color;
      customizations['statusBar.foreground'] = '#ffffff';
    }

    await config.update(
      'colorCustomizations',
      customizations,
      vscode.ConfigurationTarget.Workspace,
    );
  }
}
