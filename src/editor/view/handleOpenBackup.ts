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
          onRefresh();
          break;
        case 'export':
          // Exporting requires a workspace. For now, this could be a general export of the DB
          // but based on previous code it was exportService.exportAll(). 
          // Since our ExportWorkspaceService exports a single workspace as .code-workspace,
          // we might need a different approach for "Backup all".
          // However, the user's immediate request was to show the folder.
          vscode.window.showInformationMessage('Use o menu de contexto para exportar workspaces individuais.');
          break;
      }
    });

    panel.onDidDispose(() => {
      panel = undefined;
    });
  };
}
