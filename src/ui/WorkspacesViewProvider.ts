import * as vscode from 'vscode';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { WorkspaceService } from '../service/WorkspaceService';
import { WebviewHelper } from '../helper/WebviewHelper';
import { WorkspaceMapper } from '../mapper/WorkspaceMapper';
import { WebviewMessage } from '../type/WebviewMessage';

export class WorkspacesViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'workspaceManager.workspacesView';


  private view?: vscode.WebviewView;
  private currentQuery = '';

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly repository: WorkspaceRepository,
    private readonly service: WorkspaceService,
  ) {}

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

    const workspaces = this.service.searchWorkspaces(this.currentQuery);
    
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
          await this.service.openWorkspace(message.workspaceId);
        }
        break;
      case 'saveCurrent':
        await this.service.saveCurrentWorkspace();
        this.refresh();
        break;
      case 'deleteWorkspace':
        if (message.workspaceId) {
          const confirm = await vscode.window.showWarningMessage(
            'Tem certeza que deseja excluir este workspace?',
            { modal: true },
            'Sim',
          );
          if (confirm === 'Sim') {
            await this.service.deleteWorkspace(message.workspaceId);
            this.refresh();
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
