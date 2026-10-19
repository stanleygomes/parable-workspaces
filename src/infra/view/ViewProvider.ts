import * as vscode from 'vscode';
import { WorkspaceRepository } from '../../core/repositories/WorkspaceRepository';
import { HtmlTemplateBuilder } from './HtmlTemplateBuilder';
import { WebviewMessage } from '../../core/dtos/WebviewMessage';
import { SaveWorkspaceService } from '../../core/services/SaveWorkspaceService';
import { OpenWorkspaceService } from '../../core/services/OpenWorkspaceService';
import { DeleteWorkspaceService } from '../../core/services/DeleteWorkspaceService';
import { FindWorkspaceService } from '../../core/services/FindWorkspaceService';
import { UpdateWorkspaceFavoriteService } from '../../core/services/UpdateWorkspaceFavoriteService';
import { SettingsStateManager } from '../persistence/SettingsStateManager';
import { WorkspaceIconCache } from '../persistence/WorkspaceIconCache';
import { UpdateWorkspaceNameService } from '../../core/services/UpdateWorkspaceNameService';
import { UpdateWorkspaceEmojiService } from '../../core/services/UpdateWorkspaceEmojiService';
import { UpdateWorkspaceIconService } from '../../core/services/UpdateWorkspaceIconService';
import { UpdateWorkspaceColorService } from '../../core/services/UpdateWorkspaceColorService';
import { ViewPayload, ViewState } from './ViewState';
import { ViewMessageHandler } from './ViewMessageHandler';
import { UpdateViewFilterService } from '../../core/services/UpdateViewFilterService';
import { SortWorkspacesService } from '../../core/services/SortWorkspacesService';
import { FaviconHelper } from '../../core/helpers/FaviconHelper';

export class ViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'workspaceManager.workspacesView';

  private view?: vscode.WebviewView;
  private readonly ViewState: ViewState;
  private readonly messageHandler: ViewMessageHandler;
  private refreshTimer?: NodeJS.Timeout;
  private webviewReady = false;
  private webviewOptionsReady = false;
  private lastPayload?: ViewPayload;
  private lastPostedPayloadKey = '';
  private readonly localResourceRoots: vscode.Uri[];

  constructor(
    private readonly extensionUri: vscode.Uri,
    repository: WorkspaceRepository,
    saveService: SaveWorkspaceService,
    openService: OpenWorkspaceService,
    deleteService: DeleteWorkspaceService,
    searchService: FindWorkspaceService,
    favoriteService: UpdateWorkspaceFavoriteService,
    SettingsStateManager: SettingsStateManager,
    editNameService: UpdateWorkspaceNameService,
    changeEmojiService: UpdateWorkspaceEmojiService,
    changeIconService: UpdateWorkspaceIconService,
    changeColorService: UpdateWorkspaceColorService,
    iconCache: WorkspaceIconCache,
    private readonly webviewIconCacheDir: string,
  ) {
    this.localResourceRoots = ViewProvider.buildLocalResourceRoots(
      extensionUri,
      webviewIconCacheDir,
    );
    this.ViewState = new ViewState(
      repository,
      searchService,
      new SortWorkspacesService(),
      SettingsStateManager,
      iconCache,
    );
    const filterService = new UpdateViewFilterService(
      this.ViewState,
      SettingsStateManager,
    );
    this.messageHandler = new ViewMessageHandler(
      saveService,
      openService,
      deleteService,
      favoriteService,
      editNameService,
      changeEmojiService,
      changeIconService,
      changeColorService,
      this.ViewState,
      filterService,
      () => this.scheduleRefresh(),
    );

    repository.onDidChange(() => {
      this.scheduleRefresh();
    });
  }

  public static buildLocalResourceRoots(
    extensionUri: vscode.Uri,
    webviewIconCacheDir: string,
  ): vscode.Uri[] {
    return [extensionUri, vscode.Uri.file(webviewIconCacheDir)];
  }

  public warmup(): void {
    HtmlTemplateBuilder.prefetch(this.extensionUri);
    this.ViewState.warmIcons(false);
    this.lastPayload = this.ViewState.getPayload(false);
    setTimeout(() => {
      this.ViewState.warmIcons(true);
      this.scheduleRefresh(true);
    }, 0);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;

    if (!this.webviewReady) {
      this.ensureWebviewOptions();
      const initialPayload = this.buildReadyPayload();
      webviewView.webview.html = HtmlTemplateBuilder.build(
        webviewView.webview,
        this.extensionUri,
        'index',
        {
          initialPayload: this.toEmbeddedJson(initialPayload),
        },
      );

      webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
        if (message.command === 'webviewReady') {
          this.lastPostedPayloadKey = '';
          this.publishPayload();
          return;
        }
        this.messageHandler.handle(message);
      });

      webviewView.onDidChangeVisibility(() => {
        if (!webviewView.visible) {
          return;
        }
        this.scheduleRefresh(false);
      });

      this.webviewReady = true;
      return;
    }

    this.scheduleRefresh(false);
  }

  public refresh(): void {
    this.scheduleRefresh(true);
  }

  public getLocalResourceRoots(): readonly vscode.Uri[] {
    return this.localResourceRoots;
  }

  public areWebviewOptionsLocked(): boolean {
    return this.webviewOptionsReady;
  }

  private scheduleRefresh(immediate: boolean = false): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    if (immediate) {
      this.publishPayload();
      return;
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = undefined;
      this.publishPayload();
    }, 16);
  }

  private publishPayload(): void {
    if (!this.view) {
      return;
    }

    const payload = this.buildReadyPayload();
    const payloadKey = this.getPayloadKey(payload);
    if (payloadKey === this.lastPostedPayloadKey) {
      return;
    }

    this.lastPostedPayloadKey = payloadKey;
    this.lastPayload = payload;
    this.view.webview.postMessage(payload);
  }

  private buildReadyPayload(): ViewPayload {
    const payload = this.ViewState.getPayload(false);
    this.applyWebviewIconSources(payload);
    this.lastPayload = payload;
    return payload;
  }

  private toEmbeddedJson(payload: ViewPayload): string {
    return JSON.stringify(payload).replace(/</g, '\\u003c');
  }

  private getPayloadKey(payload: ViewPayload): string {
    return JSON.stringify({
      currentStatus: payload.currentStatus,
      filters: payload.filters,
      workspaces: payload.workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        color: workspace.color,
        emoji: workspace.emoji,
        iconSrc: workspace.iconSrc,
        iconRelativePath: workspace.iconRelativePath,
        isFavorite: workspace.isFavorite,
        dateLabel: workspace.dateLabel,
        tags: workspace.tags,
      })),
    });
  }

  private ensureWebviewOptions(): void {
    if (!this.view || this.webviewOptionsReady) {
      return;
    }

    this.view.webview.options = {
      enableScripts: true,
      localResourceRoots: this.localResourceRoots,
    };
    this.webviewOptionsReady = true;
  }

  private applyWebviewIconSources(payload: ViewPayload): void {
    if (!this.view) {
      return;
    }

    this.ensureWebviewOptions();

    for (const workspace of payload.workspaces) {
      if (!workspace.iconPath) {
        workspace.iconSrc = undefined;
        continue;
      }

      const safePath = FaviconHelper.toWebviewIconPath(
        workspace.iconPath,
        this.webviewIconCacheDir,
      );
      if (!safePath) {
        workspace.iconSrc = undefined;
        continue;
      }

      workspace.iconSrc = this.view.webview
        .asWebviewUri(vscode.Uri.file(safePath))
        .toString();
    }
  }
}
