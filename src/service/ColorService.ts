import * as vscode from 'vscode';
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
      await this.applyColor(workspace.color, workspace.textColor);
    }
  }

  public async applyColor(
    color: string | undefined,
    textColor: string | undefined,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration('workbench');
    const customizations = {
      ...(config.get<any>('colorCustomizations') || {}),
    };

    // Remove all possible previous customizations to start clean
    delete customizations['activityBar.background'];
    delete customizations['activityBar.foreground'];
    delete customizations['activityBar.activeBorder'];
    delete customizations['activityBarBadge.background'];
    delete customizations['titleBar.activeBackground'];
    delete customizations['titleBar.activeForeground'];
    delete customizations['titleBar.activeBorder'];
    delete customizations['statusBar.background'];
    delete customizations['statusBar.foreground'];
    delete customizations['statusBarItem.remoteBackground'];
    delete customizations['statusBarItem.remoteForeground'];
    delete customizations['tab.activeBorder'];

    if (color) {
      // Apply ONLY status bar background and foreground
      customizations['statusBar.background'] = color;
      customizations['statusBar.foreground'] = textColor || '#ffffff';
      customizations['statusBarItem.remoteBackground'] = color;
      customizations['statusBarItem.remoteForeground'] = textColor || '#ffffff';
    }

    await config.update(
      'colorCustomizations',
      customizations,
      vscode.ConfigurationTarget.Workspace,
    );
  }
}
