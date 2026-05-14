import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { Workspace } from '../dto/Workspace';

export class WorkspaceService {
  constructor(private readonly repository: WorkspaceRepository) {}

  async saveCurrentWorkspace(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('Nenhuma pasta aberta para salvar.');
      return;
    }

    const primaryFolder = workspaceFolders[0];
    const folders = workspaceFolders.map((f) => f.uri.fsPath);
    
    // Use the workspace file name if it exists, otherwise the primary folder name
    const workspaceFile = vscode.workspace.workspaceFile;
    const name = workspaceFile 
      ? vscode.workspace.name || primaryFolder.name
      : primaryFolder.name;

    const workspace: Workspace = {
      id: Buffer.from(workspaceFile?.fsPath || primaryFolder.uri.fsPath).toString('base64'),
      name: name,
      folders: folders,
      lastOpened: Date.now(),
      tags: [],
    };

    await this.repository.save(workspace);
    vscode.window.showInformationMessage(`Workspace "${name}" salvo com sucesso!`);
  }

  async listProjects(): Promise<void> {
    const workspaces = this.repository.getAll();
    if (workspaces.length === 0) {
      vscode.window.showInformationMessage('Nenhum workspace salvo ainda.');
      return;
    }

    const items = workspaces.map((w) => ({
      label: w.name,
      description: w.folders.length > 1 
        ? `${w.folders.length} pastas` 
        : w.folders[0],
      workspace: w,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Selecione um workspace para abrir',
    });

    if (selected) {
      const workspace = selected.workspace;
      await this.repository.updateLastOpened(workspace.id);
      
      // If it's a single folder, open it directly. 
      // For multi-root, we currently open the first folder as a fallback,
      // but in the future we will handle .code-workspace files or virtual workspaces.
      const uri = vscode.Uri.file(workspace.folders[0]);
      vscode.commands.executeCommand('vscode.openFolder', uri, false);
    }
  }
}
