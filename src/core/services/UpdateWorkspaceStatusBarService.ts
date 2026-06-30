import { WorkspaceRepository } from '../core/repositories/WorkspaceRepository';
import { EditorContext } from '../infra/editor/EditorContext';
import { EditorStatusBar } from '../infra/editor/EditorStatusBar';

export class UpdateWorkspaceStatusBarService {
  private readonly subscription: { dispose(): void };

  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly statusBar: EditorStatusBar,
  ) {
    this.repository.onDidChange(() => this.update());
    this.subscription = this.statusBar.onDidChangeWorkspaceFolders(() =>
      this.update(),
    );
    this.update();
  }

  public update(): void {
    const currentId = EditorContext.getCurrentWorkspaceId();
    if (!currentId) {
      this.statusBar.hide();
      return;
    }

    const workspace = this.repository.findOne(currentId);

    if (workspace && workspace.emoji) {
      this.statusBar.update(
        `${workspace.emoji} ${workspace.name}`,
        `Current Workspace: ${workspace.name}`,
        'workspaceManager.listProjects',
      );
    } else {
      this.statusBar.hide();
    }
  }

  public dispose(): void {
    this.subscription.dispose();
    this.statusBar.dispose();
  }
}
