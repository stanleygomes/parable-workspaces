import { WorkspaceRepository } from '../core/repositories/WorkspaceRepository';
import { UserInteraction } from '../infra/editor/UserInteraction';

export class DeleteWorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly userInteraction: UserInteraction,
  ) {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
    this.userInteraction.showInfo('Workspace deleted successfully.');
  }
}
