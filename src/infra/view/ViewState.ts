import { WorkspaceRepository } from '../../core/repositories/WorkspaceRepository';
import { FindWorkspaceService } from '../../core/services/FindWorkspaceService';
import { SortWorkspacesService } from '../../core/services/SortWorkspacesService';
import { SettingsStateManager } from '../persistence/SettingsStateManager';
import { WorkspaceIconCache } from '../persistence/WorkspaceIconCache';
import { SettingsKey } from '../../core/enums/SettingsKey';
import { SortType } from '../../core/enums/SortType';
import { WorkspaceColors } from '../../core/enums/WorkspaceColor';
import { DateHelper } from '../../core/helpers/DateHelper';
import { FaviconHelper } from '../../core/helpers/FaviconHelper';
import { EditorContext } from '../editor/EditorContext';

export interface WorkspaceViewItem {
  id: string;
  name: string;
  folders: string[];
  workspaceFile?: string;
  color?: string;
  textColor?: string;
  icon?: string;
  tags: string[];
  lastOpened: number;
  isFavorite?: boolean;
  emoji?: string;
  dateLabel: string;
  foldersCount: number;
  primaryFolder: string;
  iconPath?: string;
  iconRelativePath?: string;
  iconSrc?: string;
}

export interface ViewPayload {
  command: string;
  workspaces: WorkspaceViewItem[];
  currentStatus: {
    isSaved: boolean;
    name: string;
  };
  filters: {
    showOnlyFavorites: boolean;
    sortType: SortType;
    showFilters: boolean;
    showTimeUpdated: boolean;
    showFavicon: boolean;
    detectIcons: boolean;
  };
  availableColors: typeof WorkspaceColors;
}

export class ViewState {
  public currentQuery = '';
  public showOnlyFavorites = false;
  public currentSort = SortType.FavoritesFirst;
  public showFilters = false;
  public showTimeUpdated = false;
  public showFavicon = true;

  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly searchService: FindWorkspaceService,
    private readonly sortService: SortWorkspacesService,
    private readonly SettingsStateManager: SettingsStateManager,
    private readonly iconCache: WorkspaceIconCache,
  ) {
    this.loadFilters();
  }

  public loadFilters(): void {
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
    this.showTimeUpdated = this.SettingsStateManager.get(
      SettingsKey.ShowTimeUpdated,
      false,
    );
    this.showFavicon = this.SettingsStateManager.get(
      SettingsKey.ShowFavicon,
      true,
    );
  }

  public warmIcons(allowDeepScan: boolean = false): void {
    const detectIcons = this.SettingsStateManager.detectsIcons();
    if (!detectIcons) {
      return;
    }
    this.iconCache.warm(this.repository.findAll(), allowDeepScan, true);
  }

  public getPayload(allowDeepScan: boolean = false): ViewPayload {
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
    const detectIcons = this.SettingsStateManager.detectsIcons();

    return {
      command: 'updateWorkspaces',
      workspaces: workspaces.map((ws) => {
        const iconPath =
          this.showFavicon && !ws.emoji
            ? this.iconCache.resolve(ws, allowDeepScan, detectIcons)
            : undefined;

        return {
          id: ws.id,
          name: ws.name,
          folders: ws.folders,
          workspaceFile: ws.workspaceFile,
          color: ws.color,
          textColor: ws.textColor,
          icon: ws.icon,
          tags: ws.tags,
          lastOpened: ws.lastOpened,
          isFavorite: ws.isFavorite,
          emoji: ws.emoji,
          dateLabel: DateHelper.toHumanRelative(ws.lastOpened),
          foldersCount: ws.folders.length,
          primaryFolder: ws.folders[0] || '',
          iconPath,
          iconRelativePath: iconPath
            ? FaviconHelper.toRelativePath(
                iconPath,
                ws.folders,
                ws.workspaceFile,
              )
            : undefined,
        };
      }),
      currentStatus: {
        isSaved: isCurrentSaved,
        name: currentWorkspaceName,
      },
      filters: {
        showOnlyFavorites: this.showOnlyFavorites,
        sortType: this.currentSort,
        showFilters: this.showFilters,
        showTimeUpdated: this.showTimeUpdated,
        showFavicon: this.showFavicon,
        detectIcons,
      },
      availableColors: WorkspaceColors,
    };
  }
}
