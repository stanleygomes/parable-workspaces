import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { ColorService } from './ColorService';

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

    const colors = [
      { label: '$(circle-filled)', description: 'Blue', color: '#3498db' },
      { label: '$(circle-filled)', description: 'Red', color: '#e74c3c' },
      { label: '$(circle-filled)', description: 'Green', color: '#2ecc71' },
      { label: '$(circle-filled)', description: 'Yellow', color: '#f1c40f' },
      { label: '$(circle-filled)', description: 'Purple', color: '#9b59b6' },
      { label: '$(circle-filled)', description: 'Orange', color: '#e67e22' },
      { label: '$(circle-filled)', description: 'Cyan', color: '#1abc9c' },
      { label: '$(circle-filled)', description: 'Magenta', color: '#d33682' },
      { label: '$(circle-slash)', description: 'None', color: '' },
    ];

    const selectedColor = await vscode.window.showQuickPick(
      [
        ...colors.map((c) => ({
          label: c.label,
          description: c.description,
          color: c.color,
        })),
        { label: '$(edit)', description: 'Custom Hex Color...', color: 'custom' },
      ],
      {
        placeHolder: `Select color for "${workspace.name}"`,
      },
    );

    if (selectedColor === undefined) return;

    let color = selectedColor.color;

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
    }

    workspace.color = color;
    await this.repository.save(workspace);

    // If it's the current workspace, apply it immediately
    if (this.isCurrentWorkspace(workspace)) {
      await this.colorService.applyColor(color);
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
