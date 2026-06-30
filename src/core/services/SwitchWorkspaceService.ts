import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { OpenWorkspaceService } from './OpenWorkspaceService';
import { UserInteraction } from '../../infra/editor/UserInteraction';

export class SwitchWorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly openService: OpenWorkspaceService,
    private readonly userInteraction: UserInteraction,
  ) {}

  public async switch(): Promise<void> {
    const workspaces = this.repository.findAll();

    if (workspaces.length === 0) {
      const selection = await this.userInteraction.showInfo(
        'No workspaces saved yet.',
        'Save Current Workspace',
      );
      if (selection === 'Save Current Workspace') {
        await this.userInteraction.executeCommand(
          'workspaceManager.saveProject',
        );
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

    const selected = await this.userInteraction.showQuickPick(items, {
      placeHolder: 'Select a workspace to open',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (selected) {
      await this.openService.open(selected.id);
    }
  }
}
