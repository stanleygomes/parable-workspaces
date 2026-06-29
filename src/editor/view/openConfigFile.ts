import * as vscode from 'vscode';
import { WorkspaceRepository } from '../../repository/WorkspaceRepository';

export function createOpenConfigFile(workspaceRepository: WorkspaceRepository) {
  return async () => {
    try {
      const uri = workspaceRepository.getStorageUri();
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);
    } catch (e) {
      vscode.window.showErrorMessage(`Failed to open workspaces.json: ${e}`);
    }
  };
}
