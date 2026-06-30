import * as vscode from 'vscode';
import { Container } from '../container';
import { ViewProvider } from '../infra/view/provider/ViewProvider';

export function registerCommands(
  context: vscode.ExtensionContext,
  container: Container,
  provider: ViewProvider,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('workspaceManager.saveProject', () =>
      container.saveWorkspaceService.save(),
    ),

    vscode.commands.registerCommand(
      'workspaceManager.openWorkspace',
      (workspaceId: string) => container.openWorkspaceService.open(workspaceId),
    ),

    vscode.commands.registerCommand('workspaceManager.openConfigFile', () =>
      container.OpenWorkspacesFileService.open(),
    ),

    vscode.commands.registerCommand('workspaceManager.refreshWorkspaces', () =>
      provider.refresh(),
    ),

    vscode.commands.registerCommand('workspaceManager.listProjects', () =>
      container.switchWorkspaceService.switch(),
    ),
  );
}
