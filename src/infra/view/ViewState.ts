import { WorkspaceRepository } from '../../core/repositories/WorkspaceRepository';
import { FindWorkspaceService } from '../../core/services/FindWorkspaceService';
import { SortWorkspacesService } from '../../core/services/SortWorkspacesService';
import { SettingsStateManager } from '../persistence/SettingsStateManager';
import { SettingsKey } from '../../core/enums/SettingsKey';
import { SortType } from '../../core/enums/SortType';
import { WorkspaceColors } from '../../core/enums/WorkspaceColor';
import { DateHelper } from '../../core/helpers/DateHelper';
import { EditorContext } from '../editor/EditorContext';

/**
 * Holds the current filter, sort and search state of the sidebar view.
 * Initializes from persisted settings and builds the webview payload on demand
 * by applying search, favorites filter and ordering to the workspace list.
 */
export class ViewState {
  public currentQuery = '';
  public showOnlyFavorites = false;
  public currentSort = SortType.FavoritesFirst;
  public showFilters = false;

  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly searchService: FindWorkspaceService,
    private readonly sortService: SortWorkspacesService,
    private readonly SettingsStateManager: SettingsStateManager,
  ) {
    this.showOnlyFavorites = this.SettingsStateManager.get(
      SettingsKey.ShowOnlyFavorites,
      false,
    );
    this.currentSort = this.SettingsStateManager.get(
      SettingsKey.SortType,
      SortType.FavoritesFirst,
    );
    this.showFilters = this.SettingsStateManager.get(
      SettingsKey.ShowFilters,
      false,
    );
  }

  public getPayload() {
    let workspaces = this.searchService.search(this.currentQuery);

    if (this.showOnlyFavorites) {
      workspaces = workspaces.filter((ws) => ws.isFavorite);
    }

    workspaces = this.sortService.sort(workspaces, this.currentSort);

    const currentId = EditorContext.getCurrentWorkspaceId();
    const isCurrentSaved = currentId
      ? !!this.repository.findOne(currentId)
      : true;
    const currentWorkspaceName = EditorContext.getCurrentWorkspaceName() ?? '';

    return {
      command: 'updateWorkspaces',
      workspaces: workspaces.map((ws) => ({
        ...ws,
        dateLabel: DateHelper.toHumanRelative(ws.lastOpened),
        foldersCount: ws.folders.length,
        primaryFolder: ws.folders[0] || '',
      })),
      currentStatus: {
        isSaved: isCurrentSaved,
        name: currentWorkspaceName,
      },
      filters: {
        showOnlyFavorites: this.showOnlyFavorites,
        sortType: this.currentSort,
        showFilters: this.showFilters,
      },
      availableColors: WorkspaceColors,
    };
  }
}
