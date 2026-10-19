import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { Workspace } from '../dtos/Workspace';
import { UserInteraction } from '../../infra/editor/UserInteraction';
import { EditorContext } from '../../infra/editor/EditorContext';

export class SaveWorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly userInteraction: UserInteraction,
  ) {}

  async save(): Promise<void> {
    const id = EditorContext.getCurrentWorkspaceId();
    const folders = EditorContext.getCurrentWorkspaceFolders();
    const name = EditorContext.getCurrentWorkspaceName();
    const workspaceFile = EditorContext.getCurrentWorkspaceFile();

    if (!id || folders.length === 0 || !name) {
      this.userInteraction.showError('No folder open to save.');
      return;
    }

    const existing = this.repository.findOne(id);
    const workspace: Workspace = {
      ...existing,
      id,
      name,
      folders,
      workspaceFile,
      lastOpened: Date.now(),
      tags: existing?.tags ?? [],
    };

    await this.repository.save(workspace);
    this.userInteraction.showInfo(`Workspace "${name}" saved successfully!`);
  }
}
