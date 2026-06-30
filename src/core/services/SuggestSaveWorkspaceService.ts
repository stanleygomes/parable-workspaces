import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { SaveWorkspaceService } from './SaveWorkspaceService';
import { EditorContext } from '../../infra/editor/EditorContext';
import { UserInteraction } from '../../infra/editor/UserInteraction';

export class SuggestSaveWorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly saveService: SaveWorkspaceService,
    private readonly userInteraction: UserInteraction,
  ) {}

  async suggest(): Promise<void> {
    const currentId = EditorContext.getCurrentWorkspaceId();
    if (!currentId) {
      return;
    }

    const workspace = this.repository.findOne(currentId);

    if (!workspace) {
      const name = EditorContext.getCurrentWorkspaceName();
      if (!name) {
        return;
      }

      const action = await this.userInteraction.showInfo(
        `Would you like to save "${name}" as a Workspace?`,
        'Save Workspace',
        'Not Now',
      );

      if (action === 'Save Workspace') {
        await this.saveService.save();
      }
    }
  }
}
