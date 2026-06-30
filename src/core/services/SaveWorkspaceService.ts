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

    if (!id || folders.length === 0 || !name) {
      this.userInteraction.showError('No folder open to save.');
      return;
    }

    const workspace: Workspace = {
      id,
      name,
      folders,
      lastOpened: Date.now(),
      tags: [],
    };

    await this.repository.save(workspace);
    this.userInteraction.showInfo(`Workspace "${name}" saved successfully!`);
  }
}
