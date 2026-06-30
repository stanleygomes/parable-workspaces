import { WorkspaceRepository } from '../core/repositories/WorkspaceRepository';
import { UserInteraction } from '../infra/editor/UserInteraction';

export class DeleteWorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly userInteraction: UserInteraction,
  ) {}

  async delete(id: string): Promise<void> {
    const confirmed = await this.userInteraction.showConfirmation(
      'Are you sure you want to delete this workspace?',
    );

    if (!confirmed) {
      return;
    }

    await this.repository.delete(id);
    this.userInteraction.showInfo('Workspace deleted successfully.');
  }
}
