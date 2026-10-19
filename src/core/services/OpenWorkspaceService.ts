import * as path from 'path';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { UserInteraction } from '../../infra/editor/UserInteraction';
import { EditorContext } from '../../infra/editor/EditorContext';
import { Workspace } from '../dtos/Workspace';

export class OpenWorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly userInteraction: UserInteraction,
  ) {}

  async open(id: string, forceNewWindow: boolean = false): Promise<void> {
    const workspace = this.repository.findOne(id);
    if (!workspace) {
      return;
    }

    const openPath = EditorContext.resolveOpenPath(workspace);
    if (!openPath) {
      return;
    }

    if (
      !workspace.workspaceFile &&
      openPath.toLowerCase().endsWith('.code-workspace')
    ) {
      workspace.workspaceFile = openPath;
    }

    if (this.isCurrentlyOpen(workspace, openPath)) {
      workspace.lastOpened = Date.now();
      await this.repository.save(workspace);
      return;
    }

    await this.userInteraction.openFolder(openPath, forceNewWindow);

    workspace.lastOpened = Date.now();
    await this.repository.save(workspace);
  }

  private isCurrentlyOpen(workspace: Workspace, openPath: string): boolean {
    const currentId = EditorContext.getCurrentWorkspaceId();
    if (currentId && currentId === workspace.id) {
      return true;
    }

    const currentPath =
      EditorContext.getCurrentWorkspaceFile() ||
      EditorContext.getCurrentWorkspaceFolders()[0];
    if (!currentPath) {
      return false;
    }

    return path.normalize(currentPath) === path.normalize(openPath);
  }
}
