import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { SaveWorkspaceService } from './SaveWorkspaceService';

export class NotificationCreateWorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly saveService: SaveWorkspaceService,
  ) {}

  async checkAndNotify(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const primaryFolder = workspaceFolders[0];
    const workspaceFile = vscode.workspace.workspaceFile;
    const currentId = Buffer.from(
      workspaceFile?.fsPath || primaryFolder.uri.fsPath,
    ).toString('base64');

    const workspaces = this.repository.getAll();
    const alreadySaved = workspaces.some((w) => w.id === currentId);

    if (!alreadySaved) {
      const name = workspaceFile
        ? vscode.workspace.name || primaryFolder.name
        : primaryFolder.name;

      const action = await vscode.window.showInformationMessage(
        `Would you like to save "${name}" as a Workspace?`,
        'Save Workspace',
        'Not Now',
      );

      if (action === 'Save Workspace') {
        await this.saveService.save();
      }
    }
  }
}
