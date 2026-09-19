import * as vscode from 'vscode';
import { Container } from './container';
import { ViewProvider } from './infra/view/ViewProvider';
import { registerCommands } from './commands';
import { ConfigurationKey } from './core/enums/ConfigurationKey';
import { FaviconHelper } from './core/helpers/FaviconHelper';

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
    container.SettingsStateManager,
    container.UpdateWorkspaceNameService,
    container.UpdateWorkspaceEmojiService,
    container.UpdateWorkspaceIconService,
    container.UpdateWorkspaceColorService,
    container.workspaceIconCache,
    container.webviewIconCacheDir,
  );
  provider.warmup();

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ViewProvider.viewType, provider, {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    }),
  );

  registerCommands(context, container, provider);

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() =>
      container.suggestSaveWorkspaceService.suggest(),
    ),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(ConfigurationKey.DetectIcons)) {
        FaviconHelper.clearCache();
        container.workspaceIconCache.clear();
        provider.refresh();
      }
    }),
  );

  setTimeout(() => {
    void container.suggestSaveWorkspaceService.suggest();
    void container.editorTheme.applyCurrentWorkspaceColor();
  }, 0);

  console.log('Parable Workspaces extension activated successfully');
}

export function deactivate(): void {}
