import { describe, expect, it, vi } from 'vitest';
import { registerCommands } from './commands';
import type { Container } from './container';
import type { ViewProvider } from './infra/view/ViewProvider';
import { buildExtensionContext } from './test/unit/fakes';
import { commands } from './test/unit/mocks/vscode';

function setup() {
  const container = {
    saveWorkspaceService: { save: vi.fn() },
    openWorkspaceService: { open: vi.fn() },
    OpenWorkspacesFileService: { open: vi.fn() },
    switchWorkspaceService: { switch: vi.fn() },
  };
  const provider = { refresh: vi.fn() };
  const { context, extensionContext } = buildExtensionContext();

  registerCommands(
    extensionContext,
    container as unknown as Container,
    provider as unknown as ViewProvider,
  );

  const run = (command: string, ...args: unknown[]) => {
    const registration = commands.registerCommand.mock.calls.find(
      ([name]) => name === command,
    );
    return registration?.[1](...args);
  };

  return { container, provider, context, run };
}

describe('registerCommands', () => {
  it('registers every command and tracks its disposable', () => {
    const { context } = setup();

    expect(commands.registerCommand.mock.calls.map(([name]) => name)).toEqual([
      'workspaceManager.saveProject',
      'workspaceManager.openWorkspace',
      'workspaceManager.openConfigFile',
      'workspaceManager.refreshWorkspaces',
      'workspaceManager.listProjects',
    ]);
    expect(context.subscriptions).toHaveLength(5);
  });

  it('saves the current workspace', () => {
    const { container, run } = setup();

    run('workspaceManager.saveProject');

    expect(container.saveWorkspaceService.save).toHaveBeenCalledOnce();
  });

  it('opens a workspace by id', () => {
    const { container, run } = setup();

    run('workspaceManager.openWorkspace', 'ws-1');

    expect(container.openWorkspaceService.open).toHaveBeenCalledWith('ws-1');
  });

  it('opens the workspaces file', () => {
    const { container, run } = setup();

    run('workspaceManager.openConfigFile');

    expect(container.OpenWorkspacesFileService.open).toHaveBeenCalledOnce();
  });

  it('refreshes the sidebar', () => {
    const { provider, run } = setup();

    run('workspaceManager.refreshWorkspaces');

    expect(provider.refresh).toHaveBeenCalledOnce();
  });

  it('lists workspaces to switch', () => {
    const { container, run } = setup();

    run('workspaceManager.listProjects');

    expect(container.switchWorkspaceService.switch).toHaveBeenCalledOnce();
  });
});
