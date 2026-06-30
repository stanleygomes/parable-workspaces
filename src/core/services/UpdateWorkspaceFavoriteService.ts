import { WorkspaceRepository } from '../repositories/WorkspaceRepository';

export class UpdateWorkspaceFavoriteService {
  constructor(private readonly repository: WorkspaceRepository) {}

  async toggle(workspaceId: string): Promise<void> {
    const workspace = this.repository.findOne(workspaceId);
    if (workspace) {
      workspace.isFavorite = !workspace.isFavorite;
      await this.repository.save(workspace);
    }
  }
}
