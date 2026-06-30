import { WebviewMessage } from '../../../core/dtos/WebviewMessage';
import { SaveWorkspaceService } from '../../../core/services/SaveWorkspaceService';
import { OpenWorkspaceService } from '../../../core/services/OpenWorkspaceService';
import { DeleteWorkspaceService } from '../../../core/services/DeleteWorkspaceService';
import { UpdateWorkspaceFavoriteService } from '../../../core/services/UpdateWorkspaceFavoriteService';
import { UpdateWorkspaceNameService } from '../../../core/services/UpdateWorkspaceNameService';
import { UpdateWorkspaceEmojiService } from '../../../core/services/UpdateWorkspaceEmojiService';
import { UpdateWorkspaceColorService } from '../../../core/services/UpdateWorkspaceColorService';
import { SortType } from '../../../core/enums/SortType';
import { WorkspaceQuery } from './WorkspaceQuery';
import { UpdateViewFilterService } from '../../../core/services/UpdateViewFilterService';

/**
 * Dispatches messages received from the webview UI to the appropriate domain
 * service, acting as the bridge between the sidebar frontend and the core layer.
 */
export class ViewMessageHandler {
  constructor(
    private readonly saveService: SaveWorkspaceService,
    private readonly openService: OpenWorkspaceService,
    private readonly deleteService: DeleteWorkspaceService,
    private readonly favoriteService: UpdateWorkspaceFavoriteService,
    private readonly editNameService: UpdateWorkspaceNameService,
    private readonly changeEmojiService: UpdateWorkspaceEmojiService,
    private readonly changeColorService: UpdateWorkspaceColorService,
    private readonly workspaceQuery: WorkspaceQuery,
    private readonly filterService: UpdateViewFilterService,
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
          await this.deleteService.delete(message.workspaceId);
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
        await this.filterService.toggleFavoritesFilter(!!message.showOnlyFavorites);
        this.refreshCallback();
        break;
      case 'toggleFilters':
        await this.filterService.toggleFilters(!!message.showFilters);
        this.refreshCallback();
        break;
      case 'changeSort':
        if (message.sortType) {
          await this.filterService.changeSort(message.sortType as SortType);
          this.refreshCallback();
        }
        break;
      case 'refresh':
        this.refreshCallback();
        break;
    }
  }
}
