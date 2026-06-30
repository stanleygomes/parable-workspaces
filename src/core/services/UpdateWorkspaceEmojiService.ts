import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { EMOJIS, EmojiItem } from '../enums/Emojis';
import { UserInteraction } from '../../infra/editor/UserInteraction';

export class UpdateWorkspaceEmojiService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly userInteraction: UserInteraction,
  ) {}

  public async update(workspaceId: string): Promise<void> {
    const workspace = this.repository.findOne(workspaceId);
    if (!workspace) {
      return;
    }

    const emojiItems = EMOJIS.map((item: EmojiItem) => ({
      label: item.label,
      description: item.description,
      emoji: item.emoji,
    }));

    const selectedEmoji = await this.userInteraction.showQuickPick(
      [
        { label: '$(circle-slash)', description: 'None', emoji: '' },
        ...emojiItems,
      ],
      {
        placeHolder: `Select emoji for "${workspace.name}"`,
        matchOnDescription: true,
      },
    );

    if (selectedEmoji === undefined) {
      return;
    }

    workspace.emoji = (selectedEmoji as any).emoji;
    await this.repository.save(workspace);
  }
}
