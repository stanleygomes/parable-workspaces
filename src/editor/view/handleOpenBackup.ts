import * as vscode from 'vscode';
import { WebviewHelper } from '../../helper/WebviewHelper';
import { ImportWorkspaceService } from '../../service/ImportWorkspaceService';
import { ExportWorkspaceService } from '../../service/ExportWorkspaceService';
import { WorkspaceRepository } from '../../repository/WorkspaceRepository';

export function createHandleOpenBackup(
  extensionUri: vscode.Uri,
  importService: ImportWorkspaceService,
  exportService: ExportWorkspaceService,
  workspaceRepository: WorkspaceRepository,
  onRefresh: () => void,
) {
  let panel: vscode.WebviewPanel | undefined;

  return () => {
    if (panel) {
      panel.reveal(vscode.ViewColumn.One);
      return;
    }

    panel = vscode.window.createWebviewPanel(
      'workspaceManager.backup',
      'Backup & Sync - Parable Workspaces',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
        retainContextWhenHidden: true,
      },
    );

    const refreshWebview = () => {
      const workspaces = workspaceRepository.getAll();
      panel?.webview.postMessage({
        command: 'updateWorkspaces',
        workspaces: workspaces,
      });
    };

    panel.webview.html = WebviewHelper.getHtml(
      panel.webview,
      extensionUri,
      'backup',
      {
        workspaceDir: workspaceRepository.getStoragePath(),
      },
    );

    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'import':
          await importService.import();
          refreshWebview();
          onRefresh();
          break;
        case 'export':
          if (message.workspaceId) {
            const workspace = workspaceRepository
              .getAll()
              .find((w) => w.id === message.workspaceId);
            if (workspace) {
              await exportService.export(workspace);
            }
          }
          break;
        case 'ready':
          refreshWebview();
          break;
      }
    });

    panel.onDidDispose(() => {
      panel = undefined;
    });
  };
}
