import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { WebviewHelper } from '../helper/WebviewHelper';
import { WorkspaceMapper } from '../mapper/WorkspaceMapper';
import { WebviewMessage } from '../type/WebviewMessage';
import { SaveWorkspaceService } from '../service/SaveWorkspaceService';
import { OpenWorkspaceService } from '../service/OpenWorkspaceService';
import { DeleteWorkspaceService } from '../service/DeleteWorkspaceService';
import { SearchWorkspaceService } from '../service/SearchWorkspaceService';
import { FavoriteWorkspaceService } from '../service/FavoriteWorkspaceService';

export class WorkspacesViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'workspaceManager.workspacesView';

  private view?: vscode.WebviewView;
  private currentQuery = '';

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly repository: WorkspaceRepository,
    private readonly saveService: SaveWorkspaceService,
    private readonly openService: OpenWorkspaceService,
    private readonly deleteService: DeleteWorkspaceService,
    private readonly searchService: SearchWorkspaceService,
    private readonly favoriteService: FavoriteWorkspaceService,
  ) {
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

    const workspaces = this.searchService.search(this.currentQuery);
    
    // Sort logic: Favorites first, then by last opened
    workspaces.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return b.lastOpened - a.lastOpened;
    });

    // Check if current workspace is saved
    const workspaceFolders = vscode.workspace.workspaceFolders;
    let isCurrentSaved = true;
    let currentWorkspaceName = '';

    if (workspaceFolders && workspaceFolders.length > 0) {
      const primaryFolder = workspaceFolders[0];
      const workspaceFile = vscode.workspace.workspaceFile;
      const currentId = Buffer.from(
        workspaceFile?.fsPath || primaryFolder.uri.fsPath,
      ).toString('base64');
      isCurrentSaved = this.repository.getAll().some((w) => w.id === currentId);
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
    });
  }

  private async handleMessage(message: WebviewMessage): Promise<void> {
    switch (message.command) {
      case 'openWorkspace':
        if (message.workspaceId) {
          await this.openService.open(message.workspaceId);
        }
        break;
      case 'toggleFavorite':
        if (message.workspaceId) {
          await this.favoriteService.toggleFavorite(message.workspaceId);
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
      case 'search':
        this.currentQuery = message.query ?? '';
        this.refresh();
        break;
      case 'refresh':
        this.refresh();
        break;
    }
  }
}
