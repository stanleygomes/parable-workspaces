import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { OpenWorkspaceService } from './OpenWorkspaceService';
import { UserInteraction } from '../../infra/editor/UserInteraction';
import { WorkspaceIconCache } from '../../infra/persistence/WorkspaceIconCache';
import { SettingsStateManager } from '../../infra/persistence/SettingsStateManager';
import { SettingsKey } from '../enums/SettingsKey';
import { Workspace } from '../dtos/Workspace';
import { FaviconHelper } from '../helpers/FaviconHelper';

interface WorkspaceQuickPickItem extends vscode.QuickPickItem {
  id: string;
}

export class SwitchWorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly openService: OpenWorkspaceService,
    private readonly userInteraction: UserInteraction,
    private readonly iconCache: WorkspaceIconCache,
    private readonly settings: SettingsStateManager,
    private readonly quickPickIconCacheDir: string,
  ) {}

  public async switch(): Promise<void> {
    const workspaces = this.repository.findAll();

    if (workspaces.length === 0) {
      const selection = await this.userInteraction.showInfo(
        'No workspaces saved yet.',
        'Save Current Workspace',
      );
      if (selection === 'Save Current Workspace') {
        await this.userInteraction.executeCommand(
          'workspaceManager.saveProject',
        );
      }
      return;
    }

    const showFavicon = this.settings.get(SettingsKey.ShowFavicon, true);
    const detectIcons = this.settings.detectsIcons();
    const sortedWorkspaces = [...workspaces].sort(
      (a, b) => b.lastOpened - a.lastOpened,
    );

    const items: WorkspaceQuickPickItem[] = sortedWorkspaces.map((ws) => {
      const item: WorkspaceQuickPickItem = {
        id: ws.id,
        label: showFavicon && ws.emoji ? `${ws.emoji} ${ws.name}` : ws.name,
        detail: ws.workspaceFile || ws.folders[0] || '',
      };

      if (showFavicon && !ws.emoji) {
        const iconPath = this.resolveIconPath(ws, detectIcons);
        if (iconPath) {
          item.iconPath = iconPath;
        }
      }

      return item;
    });

    const selected = await this.userInteraction.showQuickPick(items, {
      placeHolder: 'Select a workspace to open',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (selected) {
      await this.openService.open(selected.id);
    }
  }

  private resolveIconPath(
    workspace: Workspace,
    detectIcons: boolean,
  ): vscode.Uri | vscode.ThemeIcon | undefined {
    const iconFile =
      this.iconCache.resolve(workspace, false, detectIcons) ??
      (detectIcons
        ? this.iconCache.resolve(workspace, true, detectIcons)
        : undefined);
    if (iconFile) {
      const quickPickPath = FaviconHelper.toQuickPickIconPath(
        iconFile,
        this.quickPickIconCacheDir,
      );
      if (quickPickPath) {
        return vscode.Uri.file(quickPickPath);
      }
    }
    if (detectIcons) {
      return new vscode.ThemeIcon('folder');
    }
    return undefined;
  }
}
