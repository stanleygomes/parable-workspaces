import * as vscode from 'vscode';
import { WorkspaceRepository } from './repository/WorkspaceRepository';
import { SaveWorkspaceService } from './service/SaveWorkspaceService';
import { OpenWorkspaceService } from './service/OpenWorkspaceService';
import { DeleteWorkspaceService } from './service/DeleteWorkspaceService';
import { SearchWorkspaceService } from './service/SearchWorkspaceService';
import { FavoriteWorkspaceService } from './service/FavoriteWorkspaceService';
import { SettingsService } from './service/SettingsService';
import { StatusBarService } from './service/StatusBarService';
import { EditNameWorkspaceService } from './service/EditNameWorkspaceService';
import { ChangeEmojiWorkspaceService } from './service/ChangeEmojiWorkspaceService';
import { ChangeColorWorkspaceService } from './service/ChangeColorWorkspaceService';
import { QuickPickService } from './service/QuickPickService';
import { NotificationCreateWorkspaceService } from './service/NotificationCreateWorkspaceService';
import { ColorService } from './service/ColorService';
import { WorkspacesViewProvider } from './ui/WorkspacesViewProvider';
import { createOpenConfigFile } from './editor/view';

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  console.log('Activating Parable Workspaces extension...');
  const workspaceRepository = new WorkspaceRepository(context);
  const settingsService = new SettingsService(context);

  const saveService = new SaveWorkspaceService(workspaceRepository);
  const openService = new OpenWorkspaceService(workspaceRepository);
  const deleteService = new DeleteWorkspaceService(workspaceRepository);
  const searchService = new SearchWorkspaceService(workspaceRepository);
  const favoriteService = new FavoriteWorkspaceService(workspaceRepository);
  const colorService = new ColorService(workspaceRepository);
  const editNameService = new EditNameWorkspaceService(workspaceRepository);
  const changeEmojiService = new ChangeEmojiWorkspaceService(
    workspaceRepository,
    context.extensionUri,
  );
  const changeColorService = new ChangeColorWorkspaceService(
    workspaceRepository,
    colorService,
  );
  const quickPickService = new QuickPickService(
    workspaceRepository,
    openService,
  );
  const notificationService = new NotificationCreateWorkspaceService(
    workspaceRepository,
    saveService,
  );
  const statusBarService = new StatusBarService(workspaceRepository);
  context.subscriptions.push(statusBarService);

  console.log('Services initialized successfully');

  const provider = new WorkspacesViewProvider(
    context.extensionUri,
    workspaceRepository,
    saveService,
    openService,
    deleteService,
    searchService,
    favoriteService,
    settingsService,
    editNameService,
    changeEmojiService,
    changeColorService,
  );

  const openConfigFile = createOpenConfigFile(workspaceRepository);

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
    vscode.commands.registerCommand(
      'workspaceManager.openConfigFile',
      openConfigFile,
    ),
    vscode.commands.registerCommand('workspaceManager.refreshWorkspaces', () =>
      provider.refresh(),
    ),
    vscode.commands.registerCommand('workspaceManager.listProjects', () =>
      quickPickService.show(),
    ),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() =>
      notificationService.checkAndNotify(),
    ),
  );

  notificationService.checkAndNotify();
  await colorService.applyCurrentWorkspaceColor();

  console.log('Parable Workspaces extension activated successfully');
}

export function deactivate(): void {}
