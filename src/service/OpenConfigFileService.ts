import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';

export class OpenConfigFileService {
  constructor(private readonly workspaceRepository: WorkspaceRepository) {}

  public async open(): Promise<void> {
    try {
      const uri = this.workspaceRepository.getStorageUri();
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);
    } catch (e) {
      vscode.window.showErrorMessage(`Failed to open workspaces.json: ${e}`);
    }
  }
}
