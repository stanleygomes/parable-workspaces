import { WorkspaceRepository } from '../core/repositories/WorkspaceRepository';
import { UserInteraction } from '../infra/editor/UserInteraction';

export class OpenWorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly userInteraction: UserInteraction,
  ) {}

  async open(id: string, forceNewWindow: boolean = false): Promise<void> {
    const workspace = this.repository.findOne(id);
    if (workspace) {
      workspace.lastOpened = Date.now();
      await this.repository.save(workspace);
      await this.userInteraction.openFolder(workspace.folders[0], forceNewWindow);
    }
  }
}
