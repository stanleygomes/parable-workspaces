import * as vscode from 'vscode';
import { Container } from './container';
import { WorkspacesViewProvider } from './ui/WorkspacesViewProvider';
import { registerCommands } from './commands';

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  console.log('Activating Parable Workspaces extension...');

  const container = new Container(context);
  context.subscriptions.push(container.statusBarService);

  console.log('Services initialized successfully');

  const provider = new WorkspacesViewProvider(
    context.extensionUri,
    container.workspaceRepository,
    container.saveWorkspaceService,
    container.openWorkspaceService,
    container.deleteWorkspaceService,
    container.searchWorkspaceService,
    container.favoriteWorkspaceService,
    container.settingsService,
    container.editNameWorkspaceService,
    container.changeEmojiWorkspaceService,
    container.changeColorWorkspaceService,
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      WorkspacesViewProvider.viewType,
      provider,
    ),
  );

  registerCommands(context, container, provider);

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() =>
      container.notificationCreateWorkspaceService.checkAndNotify(),
    ),
  );

  container.notificationCreateWorkspaceService.checkAndNotify();
  await container.colorService.applyCurrentWorkspaceColor();

  console.log('Parable Workspaces extension activated successfully');
}

export function deactivate(): void {}
