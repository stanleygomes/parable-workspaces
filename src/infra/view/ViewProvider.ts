import * as vscode from 'vscode';
import { WorkspaceRepository } from '../../../core/repositories/WorkspaceRepository';
import { HtmlTemplateBuilder } from '../HtmlTemplateBuilder';
import { WebviewMessage } from '../../../core/dtos/WebviewMessage';
import { SaveWorkspaceService } from '../../../core/services/SaveWorkspaceService';
import { OpenWorkspaceService } from '../../../core/services/OpenWorkspaceService';
import { DeleteWorkspaceService } from '../../../core/services/DeleteWorkspaceService';
import { FindWorkspaceService } from '../../../core/services/FindWorkspaceService';
import { UpdateWorkspaceFavoriteService } from '../../../core/services/UpdateWorkspaceFavoriteService';
import { SettingsStateManager } from '../../../infra/persistence/SettingsStateManager';
import { UpdateWorkspaceNameService } from '../../../core/services/UpdateWorkspaceNameService';
import { UpdateWorkspaceEmojiService } from '../../../core/services/UpdateWorkspaceEmojiService';
import { UpdateWorkspaceColorService } from '../../../core/services/UpdateWorkspaceColorService';
import { ViewState } from './ViewState';
import { ViewMessageHandler } from './ViewMessageHandler';
import { UpdateViewFilterService } from '../../../core/services/UpdateViewFilterService';
import { SortWorkspacesService } from '../../../core/services/SortWorkspacesService';

/**
 * VS Code WebviewViewProvider for the workspace sidebar panel.
 * Wires together the view state, message handler and HTML template, pushing
 * updated payloads to the webview whenever the workspace list or filters change.
 */
export class ViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'workspaceManager.workspacesView';

  private view?: vscode.WebviewView;
  private readonly ViewState: ViewState;
  private readonly messageHandler: ViewMessageHandler;

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
    changeColorService: UpdateWorkspaceColorService,
  ) {
    this.ViewState = new ViewState(
      repository,
      searchService,
      new SortWorkspacesService(),
      SettingsStateManager,
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
      changeColorService,
      this.ViewState,
      filterService,
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
      this.view.webview.postMessage(this.ViewState.getPayload());
    }
  }
}
