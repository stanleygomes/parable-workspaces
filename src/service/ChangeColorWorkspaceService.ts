import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { ColorService } from './ColorService';
import { WorkspaceColors } from '../enum/WorkspaceColor';

export class ChangeColorWorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly colorService: ColorService,
  ) {}

  public async changeColor(workspaceId: string): Promise<void> {
    const workspace = this.repository.getAll().find((w) => w.id === workspaceId);
    if (!workspace) {
      return;
    }

    const selectedColor = await vscode.window.showQuickPick(
      [
        ...WorkspaceColors.map((c) => ({
          label: c.label,
          description: c.description,
          color: c.color,
          textColor: c.textColor,
        })),
        { label: '🎨', description: 'Custom Hex Color...', color: 'custom' },
      ],
      {
        placeHolder: `Select color for "${workspace.name}"`,
      },
    );

    if (selectedColor === undefined) return;

    let color = (selectedColor as any).color;
    let textColor = (selectedColor as any).textColor;

    if (color === 'custom') {
      const hex = await vscode.window.showInputBox({
        prompt: 'Enter hex color (e.g. #ff0000)',
        validateInput: (value) => {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)
            ? null
            : 'Invalid hex color';
        },
      });
      if (hex === undefined) return;
      color = hex;
      textColor = '#ffffff'; // Default text color for custom colors
    }

    workspace.color = color;
    workspace.textColor = textColor;
    await this.repository.save(workspace);

    // If it's the current workspace, apply it immediately
    if (this.isCurrentWorkspace(workspace)) {
      await this.colorService.applyColor(color, textColor);
    }
  }

  private isCurrentWorkspace(workspace: any): boolean {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return false;

    const primaryFolder = workspaceFolders[0];
    const workspaceFile = vscode.workspace.workspaceFile;
    const currentId = Buffer.from(
      workspaceFile?.fsPath || primaryFolder.uri.fsPath,
    ).toString('base64');

    return workspace.id === currentId;
  }
}
