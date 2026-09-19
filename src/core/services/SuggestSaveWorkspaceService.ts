import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { SaveWorkspaceService } from './SaveWorkspaceService';
import { EditorContext } from '../../infra/editor/EditorContext';
import { UserInteraction } from '../../infra/editor/UserInteraction';
import { StringHelper } from '../helpers/StringHelper';

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

    if (this.isAlreadySaved(currentId)) {
      return;
    }

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

  private isAlreadySaved(currentId: string): boolean {
    if (this.repository.findOne(currentId)) {
      return true;
    }

    const currentWorkspaceFile = EditorContext.getCurrentWorkspaceFile();
    if (!currentWorkspaceFile) {
      return false;
    }

    return this.repository.findAll().some((workspace) => {
      if (workspace.workspaceFile === currentWorkspaceFile) {
        return true;
      }

      try {
        return StringHelper.fromBase64(workspace.id) === currentWorkspaceFile;
      } catch {
        return false;
      }
    });
  }
}
