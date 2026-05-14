import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { Project } from '../type/Project';

export class WorkspaceService {
  constructor(private readonly repository: WorkspaceRepository) {}

  async saveCurrentWorkspace(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      vscode.window.showErrorMessage('Nenhuma pasta aberta para salvar.');
      return;
    }

    const folder = folders[0];
    const project: Project = {
      id: Buffer.from(folder.uri.fsPath).toString('base64'),
      name: folder.name,
      path: folder.uri.fsPath,
      lastOpened: Date.now(),
      tags: [],
    };

    await this.repository.save(project);
    vscode.window.showInformationMessage(`Projeto "${folder.name}" salvo com sucesso!`);
  }

  async listProjects(): Promise<void> {
    const projects = this.repository.getAll();
    if (projects.length === 0) {
      vscode.window.showInformationMessage('Nenhum projeto salvo ainda.');
      return;
    }

    const items = projects.map((p) => ({
      label: p.name,
      description: p.path,
      project: p,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Selecione um projeto para abrir',
    });

    if (selected) {
      const uri = vscode.Uri.file(selected.project.path);
      await this.repository.updateLastOpened(selected.project.id);
      vscode.commands.executeCommand('vscode.openFolder', uri, false);
    }
  }
}
