import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { Workspace } from '../dto/Workspace';

export class SaveWorkspaceService {
  constructor(private readonly repository: WorkspaceRepository) {}

  async save(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('No folder open to save.');
      return;
    }

    const primaryFolder = workspaceFolders[0];
    const folders = workspaceFolders.map((f) => f.uri.fsPath);

    const workspaceFile = vscode.workspace.workspaceFile;
    const name = workspaceFile
      ? vscode.workspace.name || primaryFolder.name
      : primaryFolder.name;

    const workspace: Workspace = {
      id: Buffer.from(
        workspaceFile?.fsPath || primaryFolder.uri.fsPath,
      ).toString('base64'),
      name: name,
      folders: folders,
      lastOpened: Date.now(),
      tags: [],
    };

    await this.repository.save(workspace);
    vscode.window.showInformationMessage(
      `Workspace "${name}" saved successfully!`,
    );
  }
}
