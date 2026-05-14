import * as vscode from 'vscode';
import { WorkspaceRepository } from './repository/WorkspaceRepository';
import { SaveWorkspaceService } from './service/SaveWorkspaceService';
import { OpenWorkspaceService } from './service/OpenWorkspaceService';
import { DeleteWorkspaceService } from './service/DeleteWorkspaceService';
import { SearchWorkspaceService } from './service/SearchWorkspaceService';
import { ImportWorkspaceService } from './service/ImportWorkspaceService';
import { ExportWorkspaceService } from './service/ExportWorkspaceService';
import { NotificationCreateWorkspaceService } from './service/NotificationCreateWorkspaceService';
import { WorkspacesViewProvider } from './ui/WorkspacesViewProvider';
import { createHandleOpenBackup } from './editor/view';

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  console.log('Activating Parable Workspaces extension...');
  const workspaceRepository = new WorkspaceRepository(context);

  const saveService = new SaveWorkspaceService(workspaceRepository);
  const openService = new OpenWorkspaceService(workspaceRepository);
  const deleteService = new DeleteWorkspaceService(workspaceRepository);
  const searchService = new SearchWorkspaceService(workspaceRepository);
  const importService = new ImportWorkspaceService(workspaceRepository);
  const exportService = new ExportWorkspaceService();
  const notificationService = new NotificationCreateWorkspaceService(
    workspaceRepository,
    saveService,
  );

  console.log('Services initialized successfully');

  const provider = new WorkspacesViewProvider(
    context.extensionUri,
    workspaceRepository,
    saveService,
    openService,
    deleteService,
    searchService,
  );

  const handleOpenBackup = createHandleOpenBackup(
    context.extensionUri,
    importService,
    exportService,
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
      saveService.save(),
    ),
    vscode.commands.registerCommand(
      'workspaceManager.openWorkspace',
      (workspaceId: string) => openService.open(workspaceId),
    ),
    vscode.commands.registerCommand('workspaceManager.importWorkspace', () =>
      importService.import(),
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
