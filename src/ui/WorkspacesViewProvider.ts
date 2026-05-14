import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { WebviewHelper } from '../helper/WebviewHelper';
import { WorkspaceMapper } from '../mapper/WorkspaceMapper';
import { WebviewMessage } from '../type/WebviewMessage';
import { SaveWorkspaceService } from '../service/SaveWorkspaceService';
import { OpenWorkspaceService } from '../service/OpenWorkspaceService';
import { DeleteWorkspaceService } from '../service/DeleteWorkspaceService';
import { SearchWorkspaceService } from '../service/SearchWorkspaceService';

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
    
    // Sort by last opened by default
    workspaces.sort((a, b) => b.lastOpened - a.lastOpened);

    this.view.webview.postMessage({
      command: 'updateWorkspaces',
      workspaces: workspaces.map((ws) => WorkspaceMapper.toWebview(ws)),
    });
  }

  private async handleMessage(message: WebviewMessage): Promise<void> {
    switch (message.command) {
      case 'openWorkspace':
        if (message.workspaceId) {
          await this.openService.open(message.workspaceId);
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
