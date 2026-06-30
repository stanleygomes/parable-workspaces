import * as vscode from 'vscode';
import { WorkspaceRepository } from '../../../core/repositories/WorkspaceRepository';
import { HtmlTemplateBuilder } from '../HtmlTemplateBuilder';
import { WebviewMessage } from '../../../core/dtos/WebviewMessage';
import { SaveWorkspaceService } from '../../../core/services/SaveWorkspaceService';
import { OpenWorkspaceService } from '../../../core/services/OpenWorkspaceService';
import { DeleteWorkspaceService } from '../../../core/services/DeleteWorkspaceService';
import { FindWorkspaceService } from '../../../core/services/FindWorkspaceService';
import { UpdateWorkspaceFavoriteService } from '../../../core/services/UpdateWorkspaceFavoriteService';
import { SettingsService } from '../../../core/services/SettingsService';
import { UpdateWorkspaceNameService } from '../../../core/services/UpdateWorkspaceNameService';
import { UpdateWorkspaceEmojiService } from '../../../core/services/UpdateWorkspaceEmojiService';
import { UpdateWorkspaceColorService } from '../../../core/services/UpdateWorkspaceColorService';
import { WorkspaceQuery } from './WorkspaceQuery';
import { ViewMessageHandler } from './ViewMessageHandler';

export class ViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'workspaceManager.workspacesView';

  private view?: vscode.WebviewView;
  private readonly workspaceQuery: WorkspaceQuery;
  private readonly messageHandler: ViewMessageHandler;

  constructor(
    private readonly extensionUri: vscode.Uri,
    repository: WorkspaceRepository,
    saveService: SaveWorkspaceService,
    openService: OpenWorkspaceService,
    deleteService: DeleteWorkspaceService,
    searchService: FindWorkspaceService,
    favoriteService: UpdateWorkspaceFavoriteService,
    settingsService: SettingsService,
    editNameService: UpdateWorkspaceNameService,
    changeEmojiService: UpdateWorkspaceEmojiService,
    changeColorService: UpdateWorkspaceColorService,
  ) {
    this.workspaceQuery = new WorkspaceQuery(
      repository,
      searchService,
      settingsService,
    );
    this.messageHandler = new ViewMessageHandler(
      saveService,
      openService,
      deleteService,
      favoriteService,
      settingsService,
      editNameService,
      changeEmojiService,
      changeColorService,
      this.workspaceQuery,
      () => this.refresh(),
    );

    repository.onDidChange(() => {
      this.refresh();
    });
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = HtmlTemplateBuilder.build(
      webviewView.webview,
      this.extensionUri,
    );

    webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
      this.messageHandler.handle(message);
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refresh();
      }
    });

    this.refresh();
  }

  public refresh(): void {
    if (this.view) {
      this.view.webview.postMessage(this.workspaceQuery.getPayload());
    }
  }
}
