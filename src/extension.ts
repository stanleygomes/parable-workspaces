import * as vscode from 'vscode';
import { Container } from './container';
import { WorkspacesViewProvider } from './ui/WorkspacesViewProvider';
import { registerCommands } from './commands';

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  console.log('Activating Parable Workspaces extension...');

  // Initialize dependency injection container
  const container = new Container(context);
  context.subscriptions.push(container.statusBarService);

  console.log('Services initialized successfully');

  // Initialize the sidebar view provider with necessary services
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

  // Register the webview view provider with VS Code
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      WorkspacesViewProvider.viewType,
      provider,
    ),
  );

  // Register all commands decoupled from the main file
  registerCommands(context, container, provider);

  // Listen for changes in workspace folders to verify and notify updates
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() =>
      container.notificationCreateWorkspaceService.checkAndNotify(),
    ),
  );

  // Initial verification and applying theme colors to current workspace
  container.notificationCreateWorkspaceService.checkAndNotify();
  await container.colorService.applyCurrentWorkspaceColor();

  console.log('Parable Workspaces extension activated successfully');
}

export function deactivate(): void {}
