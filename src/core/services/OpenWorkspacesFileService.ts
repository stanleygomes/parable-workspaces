import { WorkspaceStateManager } from '../../infra/persistence/WorkspaceStateManager';
import { UserInteraction } from '../../infra/editor/UserInteraction';

export class OpenWorkspacesFileService {
  constructor(
    private readonly workspaceStateManager: WorkspaceStateManager,
    private readonly userInteraction: UserInteraction,
  ) {}

  public async open(): Promise<void> {
    try {
      const uri = this.workspaceStateManager.getStorageUri();
      await this.userInteraction.openTextDocument(uri);
    } catch (e: any) {
      this.userInteraction.showError(
        `Failed to open workspaces.json: ${e.message || e}`,
      );
    }
  }
}
