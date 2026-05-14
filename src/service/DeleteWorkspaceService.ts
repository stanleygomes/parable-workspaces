import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';

export class DeleteWorkspaceService {
  constructor(private readonly repository: WorkspaceRepository) {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
    vscode.window.showInformationMessage('Workspace deleted successfully.');
  }
}
