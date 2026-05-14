import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { EmojiHelper } from '../helper/EmojiHelper';

export class EditWorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly extensionUri: vscode.Uri,
  ) {}

  public async edit(workspaceId: string): Promise<void> {
    const workspace = this.repository.getAll().find((w) => w.id === workspaceId);
    if (!workspace) {
      return;
    }

    const name = await vscode.window.showInputBox({
      prompt: 'Workspace Name',
      value: workspace.name,
    });

    if (name === undefined) return;

    workspace.name = name;
    await this.repository.save(workspace);
  }

  public async changeEmoji(workspaceId: string): Promise<void> {
    const workspace = this.repository.getAll().find((w) => w.id === workspaceId);
    if (!workspace) {
      return;
    }

    const emojiItems = EmojiHelper.getEmojis(this.extensionUri).map((item) => ({
      label: item.label,
      description: item.description,
      emoji: item.emoji,
    }));

    const selectedEmoji = await vscode.window.showQuickPick(
      [
        { label: '$(circle-slash)', description: 'None', emoji: '' },
        ...emojiItems,
      ],
      {
        placeHolder: `Select emoji for "${workspace.name}"`,
        matchOnDescription: true,
      },
    );

    if (selectedEmoji === undefined) return;

    workspace.emoji = (selectedEmoji as any).emoji;
    await this.repository.save(workspace);
  }
}
