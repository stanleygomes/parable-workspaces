import * as vscode from 'vscode';
import { Container } from './container';
import { ViewProvider } from './infra/view/provider/ViewProvider';
import { registerCommands } from './commands';

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  console.log('Activating Parable Workspaces extension...');

  const container = new Container(context);
  context.subscriptions.push(container.updateWorkspaceStatusBarService);

  console.log('Services initialized successfully');

  const provider = new ViewProvider(
    context.extensionUri,
    container.workspaceRepository,
    container.saveWorkspaceService,
    container.openWorkspaceService,
    container.deleteWorkspaceService,
    container.FindWorkspaceService,
    container.UpdateWorkspaceFavoriteService,
    container.settingsService,
    container.UpdateWorkspaceNameService,
    container.UpdateWorkspaceEmojiService,
    container.UpdateWorkspaceColorService,
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ViewProvider.viewType, provider),
  );

  registerCommands(context, container, provider);

  context.subscriptions.push(
    vscode.workspace.onDidUpdateWorkspaceFolders(() =>
      container.suggestSaveWorkspaceService.suggest(),
    ),
  );

  container.suggestSaveWorkspaceService.suggest();
  await container.editorTheme.applyCurrentWorkspaceColor();

  console.log('Parable Workspaces extension activated successfully');
}

export function deactivate(): void {}
