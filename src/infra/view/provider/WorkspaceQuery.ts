import * as vscode from 'vscode';
import { WorkspaceRepository } from '../../../core/repositories/WorkspaceRepository';
import { FindWorkspaceService } from '../../../core/services/FindWorkspaceService';
import { SettingsStateManager } from '../../../infra/persistence/SettingsStateManager';
import { SettingsKey } from '../../../core/enums/SettingsKey';
import { SortType } from '../../../core/enums/SortType';
import { WorkspaceColors } from '../../../core/enums/WorkspaceColor';
import { DateHelper } from '../../../core/helpers/DateHelper';

export class WorkspaceQuery {
  public currentQuery = '';
  public showOnlyFavorites = false;
  public currentSort = SortType.FavoritesFirst;
  public showFilters = false;

  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly searchService: FindWorkspaceService,
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

    workspaces.sort((a, b) => {
      switch (this.currentSort) {
        case SortType.FavoritesFirst:
          if (a.isFavorite && !b.isFavorite) {
            return -1;
          }
          if (!a.isFavorite && b.isFavorite) {
            return 1;
          }
          return b.lastOpened - a.lastOpened;
        case SortType.Alphabetical:
          return a.name.localeCompare(b.name);
        case SortType.Recent:
          return b.lastOpened - a.lastOpened;
        default:
          return 0;
      }
    });

    const workspaceFolders = vscode.workspace.workspaceFolders;
    let isCurrentSaved = true;
    let currentWorkspaceName = '';

    if (workspaceFolders && workspaceFolders.length > 0) {
      const primaryFolder = workspaceFolders[0];
      const workspaceFile = vscode.workspace.workspaceFile;
      const currentId = Buffer.from(
        workspaceFile?.fsPath || primaryFolder.uri.fsPath,
      ).toString('base64');
      isCurrentSaved = this.repository
        .findAll()
        .some((w) => w.id === currentId);
      currentWorkspaceName = workspaceFile
        ? vscode.workspace.name || primaryFolder.name
        : primaryFolder.name;
    }

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
