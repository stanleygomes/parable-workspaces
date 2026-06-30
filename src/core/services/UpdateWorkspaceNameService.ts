import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { UserInteraction } from '../../infra/editor/UserInteraction';

export class UpdateWorkspaceNameService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly userInteraction: UserInteraction,
  ) {}

  public async update(workspaceId: string): Promise<void> {
    const workspace = this.repository.findOne(workspaceId);
    if (!workspace) {
      return;
    }

    const name = await this.userInteraction.showInputBox({
      prompt: 'Workspace Name',
      value: workspace.name,
    });

    if (name === undefined) {return;}

    workspace.name = name;
    await this.repository.save(workspace);
  }
}
