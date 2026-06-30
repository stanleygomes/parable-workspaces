import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { EditorTheme } from '../infra/editor/EditorTheme';
import { WorkspaceColors } from '../enum/WorkspaceColor';
import { UserInteraction } from '../infra/editor/UserInteraction';
import { EditorContext } from '../infra/editor/EditorContext';

export class UpdateWorkspaceColorService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly editorTheme: EditorTheme,
    private readonly userInteraction: UserInteraction,
  ) {}

  public async update(workspaceId: string): Promise<void> {
    const workspace = this.repository.findOne(workspaceId);
    if (!workspace) {
      return;
    }

    const selectedColor = await this.userInteraction.showQuickPick(
      WorkspaceColors.map((c) => ({
        label: c.label,
        description: c.description,
        color: c.color,
        textColor: c.textColor,
      })),
      {
        placeHolder: `Select color for "${workspace.name}"`,
      },
    );

    if (selectedColor === undefined) return;

    workspace.color = (selectedColor as any).color;
    workspace.textColor = (selectedColor as any).textColor;
    await this.repository.save(workspace);

    if (workspace.id === EditorContext.getCurrentWorkspaceId()) {
      await this.editorTheme.applyColor(workspace.color, workspace.textColor);
    }
  }
}
