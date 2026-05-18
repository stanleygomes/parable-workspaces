import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { OpenWorkspaceService } from './OpenWorkspaceService';

export class QuickPickService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly openService: OpenWorkspaceService,
  ) {}

  public async show(): Promise<void> {
    const workspaces = this.repository.getAll();

    if (workspaces.length === 0) {
      const selection = await vscode.window.showInformationMessage(
        'No workspaces saved yet.',
        'Save Current Workspace',
      );
      if (selection === 'Save Current Workspace') {
        await vscode.commands.executeCommand('workspaceManager.saveProject');
      }
      return;
    }

    const sortedWorkspaces = [...workspaces].sort(
      (a, b) => b.lastOpened - a.lastOpened,
    );

    const items = sortedWorkspaces.map((ws) => ({
      label: `${ws.emoji ? ws.emoji + ' ' : ''}${ws.name}`,
      detail: ws.folders[0] || '',
      id: ws.id,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a workspace to open',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (selected) {
      await this.openService.open(selected.id);
    }
  }
}
