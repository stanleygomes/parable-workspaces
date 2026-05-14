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

  async openWorkspace(id: string): Promise<void> {
    const workspaces = this.repository.getAll();
    const workspace = workspaces.find((w) => w.id === id);
    if (workspace) {
      await this.repository.updateLastOpened(workspace.id);
      const uri = vscode.Uri.file(workspace.folders[0]);
      vscode.commands.executeCommand('vscode.openFolder', uri, false);
    }
  }

  async deleteWorkspace(id: string): Promise<void> {
    await this.repository.delete(id);
    vscode.window.showInformationMessage('Workspace excluído com sucesso.');
  }

  searchWorkspaces(query: string): Workspace[] {
    const workspaces = this.repository.getAll();
    if (!query.trim()) {
      return workspaces;
    }
    const q = query.toLowerCase();
    return workspaces.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.folders.some((f) => f.toLowerCase().includes(q)) ||
        w.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
}

