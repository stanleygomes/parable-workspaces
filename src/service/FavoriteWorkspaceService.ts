import { WorkspaceRepository } from '../repository/WorkspaceRepository';

export class FavoriteWorkspaceService {
  constructor(private readonly repository: WorkspaceRepository) {}

  async toggleFavorite(workspaceId: string): Promise<void> {
    const workspaces = this.repository.getAll();
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      workspace.isFavorite = !workspace.isFavorite;
      await this.repository.save(workspace);
    }
  }
}
