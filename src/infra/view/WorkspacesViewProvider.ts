import * as vscode from 'vscode';
import { WorkspaceRepository } from '../../core/repositories/WorkspaceRepository';
import { WebviewHelper } from './WebviewHelper';
import { WorkspaceMapper } from './WorkspaceMapper';
import { WebviewMessage } from '../../core/dtos/WebviewMessage';
import { SaveWorkspaceService } from '../../core/services/SaveWorkspaceService';
import { OpenWorkspaceService } from '../../core/services/OpenWorkspaceService';
import { DeleteWorkspaceService } from '../../core/services/DeleteWorkspaceService';
import { FindWorkspaceService } from '../../core/services/FindWorkspaceService';
import { UpdateWorkspaceFavoriteService } from '../../core/services/UpdateWorkspaceFavoriteService';
import {
  SettingsService,
  SettingsKey,
} from '../../core/services/SettingsService';
import { UpdateWorkspaceNameService } from '../../core/services/UpdateWorkspaceNameService';
import { UpdateWorkspaceEmojiService } from '../../core/services/UpdateWorkspaceEmojiService';
import { UpdateWorkspaceColorService } from '../../core/services/UpdateWorkspaceColorService';
import { WorkspaceColors } from '../../core/enums/WorkspaceColor';
import { SortType } from '../../core/enums/SortType';

export class WorkspacesViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'workspaceManager.workspacesView';

  private view?: vscode.WebviewView;
  private currentQuery = '';
  private showOnlyFavorites = false;
  private currentSort = SortType.FavoritesFirst;
  private showFilters = false;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly repository: WorkspaceRepository,
    private readonly saveService: SaveWorkspaceService,
    private readonly openService: OpenWorkspaceService,
    private readonly deleteService: DeleteWorkspaceService,
    private readonly searchService: FindWorkspaceService,
    private readonly favoriteService: UpdateWorkspaceFavoriteService,
    private readonly settingsService: SettingsService,
    private readonly editNameService: UpdateWorkspaceNameService,
    private readonly changeEmojiService: UpdateWorkspaceEmojiService,
    private readonly changeColorService: UpdateWorkspaceColorService,
  ) {
    this.showOnlyFavorites = this.settingsService.get(
      SettingsKey.ShowOnlyFavorites,
      false,
    );
    this.currentSort = this.settingsService.get(
      SettingsKey.SortType,
      SortType.FavoritesFirst,
    );
    this.showFilters = this.settingsService.get(SettingsKey.ShowFilters, false);
    this.repository.onDidChange(() => {
      this.refresh();
    });
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = WebviewHelper.getHtml(
      webviewView.webview,
      this.extensionUri,
    );

    webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
      this.handleMessage(message);
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refresh();
      }
    });

    this.refresh();
  }

  refresh(): void {
    if (!this.view) {
      return;
    }

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

    this.view.webview.postMessage({
      command: 'updateWorkspaces',
      workspaces: workspaces.map((ws) => WorkspaceMapper.toWebview(ws)),
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
    });
  }

  private async handleMessage(message: WebviewMessage): Promise<void> {
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
        this.currentQuery = message.query ?? '';
        this.refresh();
        break;
      case 'toggleFavoritesFilter':
        this.showOnlyFavorites = !!message.showOnlyFavorites;
        await this.settingsService.set(
          SettingsKey.ShowOnlyFavorites,
          this.showOnlyFavorites,
        );
        this.refresh();
        break;
      case 'toggleFilters':
        this.showFilters = !!message.showFilters;
        await this.settingsService.set(
          SettingsKey.ShowFilters,
          this.showFilters,
        );
        this.refresh();
        break;
      case 'changeSort':
        if (message.sortType) {
          this.currentSort = message.sortType as SortType;
          await this.settingsService.set(
            SettingsKey.SortType,
            this.currentSort,
          );
          this.refresh();
        }
        break;
      case 'refresh':
        this.refresh();
        break;
    }
  }
}
