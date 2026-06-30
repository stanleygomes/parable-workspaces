import * as vscode from 'vscode';
import { WebviewMessage } from '../../../core/dtos/WebviewMessage';
import { SaveWorkspaceService } from '../../../core/services/SaveWorkspaceService';
import { OpenWorkspaceService } from '../../../core/services/OpenWorkspaceService';
import { DeleteWorkspaceService } from '../../../core/services/DeleteWorkspaceService';
import { UpdateWorkspaceFavoriteService } from '../../../core/services/UpdateWorkspaceFavoriteService';
import {
  SettingsService,
  SettingsKey,
} from '../../../core/services/SettingsService';
import { UpdateWorkspaceNameService } from '../../../core/services/UpdateWorkspaceNameService';
import { UpdateWorkspaceEmojiService } from '../../../core/services/UpdateWorkspaceEmojiService';
import { UpdateWorkspaceColorService } from '../../../core/services/UpdateWorkspaceColorService';
import { SortType } from '../../../core/enums/SortType';
import { WorkspaceQuery } from './WorkspaceQuery';

export class ViewMessageHandler {
  constructor(
    private readonly saveService: SaveWorkspaceService,
    private readonly openService: OpenWorkspaceService,
    private readonly deleteService: DeleteWorkspaceService,
    private readonly favoriteService: UpdateWorkspaceFavoriteService,
    private readonly settingsService: SettingsService,
    private readonly editNameService: UpdateWorkspaceNameService,
    private readonly changeEmojiService: UpdateWorkspaceEmojiService,
    private readonly changeColorService: UpdateWorkspaceColorService,
    private readonly workspaceQuery: WorkspaceQuery,
    private readonly refreshCallback: () => void,
  ) {}

  public async handle(message: WebviewMessage): Promise<void> {
    switch (message.command) {
      case 'openWorkspace':
        if (message.workspaceId) {
          await this.openService.open(message.workspaceId, false);
        }
        break;
      case 'openWorkspaceNewWindow':
        if (message.workspaceId) {
          await this.openService.open(message.workspaceId, true);
        }
        break;
      case 'toggleFavorite':
        if (message.workspaceId) {
          await this.favoriteService.toggle(message.workspaceId);
        }
        break;
      case 'saveCurrent':
        await this.saveService.save();
        break;
      case 'deleteWorkspace':
        if (message.workspaceId) {
          const confirm = await vscode.window.showWarningMessage(
            'Are you sure you want to delete this workspace?',
            { modal: true },
            'Yes',
          );
          if (confirm === 'Yes') {
            await this.deleteService.delete(message.workspaceId);
          }
        }
        break;
      case 'editWorkspace':
        if (message.workspaceId) {
          await this.editNameService.update(message.workspaceId);
        }
        break;
      case 'changeEmoji':
        if (message.workspaceId) {
          await this.changeEmojiService.update(message.workspaceId);
        }
        break;
      case 'changeColor':
        if (message.workspaceId) {
          await this.changeColorService.update(message.workspaceId);
        }
        break;
      case 'search':
        this.workspaceQuery.currentQuery = message.query ?? '';
        this.refreshCallback();
        break;
      case 'toggleFavoritesFilter':
        this.workspaceQuery.showOnlyFavorites = !!message.showOnlyFavorites;
        await this.settingsService.set(
          SettingsKey.ShowOnlyFavorites,
          this.workspaceQuery.showOnlyFavorites,
        );
        this.refreshCallback();
        break;
      case 'toggleFilters':
        this.workspaceQuery.showFilters = !!message.showFilters;
        await this.settingsService.set(
          SettingsKey.ShowFilters,
          this.workspaceQuery.showFilters,
        );
        this.refreshCallback();
        break;
      case 'changeSort':
        if (message.sortType) {
          this.workspaceQuery.currentSort = message.sortType as SortType;
          await this.settingsService.set(
            SettingsKey.SortType,
            this.workspaceQuery.currentSort,
          );
          this.refreshCallback();
        }
        break;
      case 'refresh':
        this.refreshCallback();
        break;
    }
  }
}
