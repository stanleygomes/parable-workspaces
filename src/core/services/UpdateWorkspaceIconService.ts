import * as path from 'path';
import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { UserInteraction } from '../../infra/editor/UserInteraction';
import { FaviconHelper } from '../helpers/FaviconHelper';

interface IconPickItem extends vscode.QuickPickItem {
  action: 'browse' | 'clear' | 'select';
  iconFilePath?: string;
}

export class UpdateWorkspaceIconService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly userInteraction: UserInteraction,
  ) {}

  public async update(workspaceId: string): Promise<void> {
    const workspace = this.repository.findOne(workspaceId);
    if (!workspace) {
      return;
    }

    const roots = [
      ...(workspace.workspaceFile
        ? [path.dirname(workspace.workspaceFile)]
        : []),
      ...workspace.folders,
    ];
    const root = roots[0] || '';
    const candidates = FaviconHelper.listCandidateIcons(
      workspace.folders,
      20,
      workspace.workspaceFile,
    );
    const currentIcon = workspace.icon
      ? path.normalize(workspace.icon)
      : undefined;

    const candidateItems: IconPickItem[] = candidates.map((filePath) => {
      const relativeRoot =
        roots.find((candidateRoot) =>
          path.normalize(filePath).startsWith(path.normalize(candidateRoot)),
        ) || root;
      const relative = relativeRoot
        ? path.relative(relativeRoot, filePath).split(path.sep).join('/')
        : filePath;
      const isCurrent = currentIcon === path.normalize(filePath);

      return {
        label: path.basename(filePath),
        description: isCurrent ? `${relative} (current)` : relative,
        iconPath: vscode.Uri.file(filePath),
        action: 'select',
        iconFilePath: filePath,
      };
    });

    const selected = await this.userInteraction.showQuickPick<IconPickItem>(
      [
        {
          label: '$(circle-slash) None',
          action: 'clear',
          description: 'Clear icon',
        },
        {
          label: '$(folder-opened) Browse...',
          action: 'browse',
          description: 'Pick an image file',
        },
        ...candidateItems,
      ],
      {
        placeHolder: `Select icon for "${workspace.name}"`,
        matchOnDescription: true,
      },
    );

    if (!selected) {
      return;
    }

    if (selected.action === 'clear') {
      workspace.icon = undefined;
      FaviconHelper.clearCache();
      await this.repository.save(workspace);
      return;
    }

    if (selected.action === 'select' && selected.iconFilePath) {
      workspace.icon = selected.iconFilePath;
      FaviconHelper.clearCache();
      await this.repository.save(workspace);
      return;
    }

    const uris = await this.userInteraction.showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select Icon',
      filters: {
        Images: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'],
      },
      defaultUri: root ? vscode.Uri.file(root) : undefined,
    });

    if (!uris || uris.length === 0) {
      return;
    }

    const iconPath = uris[0].fsPath;
    if (!FaviconHelper.toDataUri(iconPath)) {
      this.userInteraction.showError('Selected file is not a usable image.');
      return;
    }

    workspace.icon = iconPath;
    FaviconHelper.clearCache();
    await this.repository.save(workspace);
  }
}
