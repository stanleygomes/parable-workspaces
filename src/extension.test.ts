import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activate, deactivate } from './extension';
import { Container } from './container';
import { ViewProvider } from './infra/view/ViewProvider';
import { StringHelper } from './core/helpers/StringHelper';
import {
  FakeMemento,
  buildExtensionContext,
  buildWorkspace,
} from './test/unit/fakes';
import {
  commands,
  configurationStore,
  setWorkspace,
  window,
  workspaceFoldersEmitter,
} from './test/unit/mocks/vscode';

vi.mock('./infra/persistence/WorkspaceStateManager', async () => {
  const fakes = await import('./test/unit/fakes');
  return { WorkspaceStateManager: fakes.GlobalStateWorkspaceStateManager };
});

describe('extension', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('returns the wired container', async () => {
    const { extensionContext } = buildExtensionContext();

    await expect(activate(extensionContext)).resolves.toBeInstanceOf(Container);
  });

  it('registers the sidebar provider, commands and listeners', async () => {
    const { context, extensionContext } = buildExtensionContext();

    await activate(extensionContext);

    expect(window.registerWebviewViewProvider).toHaveBeenCalledWith(
      ViewProvider.viewType,
      expect.any(ViewProvider),
    );
    expect(commands.registerCommand).toHaveBeenCalledTimes(5);
    expect(context.subscriptions).toHaveLength(8);
  });

  it('suggests saving an unsaved workspace on activation and folder change', async () => {
    setWorkspace(['/projects/new']);
    const { extensionContext } = buildExtensionContext();

    await activate(extensionContext);
    workspaceFoldersEmitter.fire();

    expect(window.showInformationMessage).toHaveBeenCalledTimes(2);
    expect(window.showInformationMessage).toHaveBeenCalledWith(
      'Would you like to save "new" as a Workspace?',
      'Save Workspace',
      'Not Now',
    );
  });

  it('applies the saved color of the current workspace', async () => {
    setWorkspace(['/projects/new']);
    const { extensionContext } = buildExtensionContext({
      globalState: new FakeMemento({
        savedProjects: [
          buildWorkspace({
            id: StringHelper.toBase64('/projects/new'),
            color: '#2ecc71',
            textColor: '#ffffff',
          }),
        ],
      }),
    });

    await activate(extensionContext);

    expect(configurationStore.get('workbench.colorCustomizations')).toEqual({
      'statusBar.background': '#2ecc71',
      'statusBar.foreground': '#ffffff',
      'statusBarItem.remoteBackground': '#2ecc71',
      'statusBarItem.remoteForeground': '#ffffff',
    });
    expect(window.showInformationMessage).not.toHaveBeenCalled();
  });

  it('deactivates without side effects', () => {
    expect(() => deactivate()).not.toThrow();
  });
});
