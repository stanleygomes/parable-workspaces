import * as vscode from 'vscode';
import { WorkspaceRepository } from './repository/WorkspaceRepository';
import { WorkspaceService } from './service/WorkspaceService';
import { ImportWorkspaceService } from './service/ImportWorkspaceService';
import { ExportWorkspaceService } from './service/ExportWorkspaceService';
import { WorkspacesViewProvider } from './ui/WorkspacesViewProvider';
import { NotificationService } from './service/NotificationService';
import { createHandleOpenBackup } from './editor/view';

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  console.log('Activating Parable Workspaces extension...');
  const workspaceRepository = new WorkspaceRepository(context);

  const workspaceService = new WorkspaceService(workspaceRepository);
  const importWorkspaceService = new ImportWorkspaceService(
    workspaceRepository,
  );
  const exportWorkspaceService = new ExportWorkspaceService();
  const notificationService = new NotificationService(
    workspaceRepository,
    workspaceService,
  );

  console.log('Services initialized successfully');

  const provider = new WorkspacesViewProvider(
    context.extensionUri,
    workspaceRepository,
    workspaceService,
  );

  const handleOpenBackup = createHandleOpenBackup(
    context.extensionUri,
    importWorkspaceService,
    exportWorkspaceService,
    workspaceRepository,
    () => provider.refresh(),
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      WorkspacesViewProvider.viewType,
      provider,
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('workspaceManager.saveProject', () =>
      workspaceService.saveCurrentWorkspace(),
    ),
    vscode.commands.registerCommand(
      'workspaceManager.openWorkspace',
      (workspaceId: string) => workspaceService.openWorkspace(workspaceId),
    ),
    vscode.commands.registerCommand('workspaceManager.importWorkspace', () =>
      importWorkspaceService.import(),
    ),
    vscode.commands.registerCommand(
      'workspaceManager.openBackup',
      handleOpenBackup,
    ),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() =>
      notificationService.checkAndNotify(),
    ),
  );

  notificationService.checkAndNotify();

  console.log('Parable Workspaces extension activated successfully');
}

export function deactivate(): void {}
