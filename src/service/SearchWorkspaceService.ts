import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { Workspace } from '../dto/Workspace';

export class SearchWorkspaceService {
  constructor(private readonly repository: WorkspaceRepository) {}

  search(query: string): Workspace[] {
    const workspaces = this.repository.getAll();
    if (!query.trim()) {
      return workspaces;
    }
    const q = query.toLowerCase();
    return workspaces.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.folders.some((f) => f.toLowerCase().includes(q)) ||
        w.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
}
