import { describe, expect, it, vi } from 'vitest';
import type {
  CancellationToken,
  WebviewView,
  WebviewViewResolveContext,
} from 'vscode';
import { FindWorkspaceService } from '../../core/services/FindWorkspaceService';
import { SettingsStateManager } from '../persistence/SettingsStateManager';
import {
  buildExtensionContext,
  buildRepository,
  buildWorkspace,
} from '../../test/unit/fakes';
import { EventEmitter, Uri } from '../../test/unit/mocks/vscode';
import { ViewProvider } from './ViewProvider';

function buildWebviewView() {
  const messages = new EventEmitter<unknown>();
  const visibility = new EventEmitter<void>();
  const view = {
    visible: true,
    webview: {
      options: {},
      html: '',
      postMessage: vi.fn(),
      onDidReceiveMessage: messages.event,
    },
    onDidChangeVisibility: visibility.event,
  };
  return { view, messages, visibility };
}

function setup() {
  const { repository } = buildRepository([buildWorkspace({ id: 'a' })]);
  const { extensionContext } = buildExtensionContext();
  const saveService = { save: vi.fn() };
  const extensionUri = Uri.file(process.cwd());
  const provider = new ViewProvider(
    extensionUri as never,
    repository,
    saveService as never,
    { open: vi.fn() } as never,
    { delete: vi.fn() } as never,
    new FindWorkspaceService(repository),
    { toggle: vi.fn() } as never,
    new SettingsStateManager(extensionContext),
    { update: vi.fn() } as never,
    { update: vi.fn() } as never,
    { update: vi.fn() } as never,
  );
  const webview = buildWebviewView();
  const resolve = () =>
    provider.resolveWebviewView(
      webview.view as unknown as WebviewView,
      {} as WebviewViewResolveContext,
      {} as CancellationToken,
    );
  return {
    provider,
    repository,
    saveService,
    extensionUri,
    resolve,
    ...webview,
  };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('ViewProvider', () => {
  it('uses the contributed view id', () => {
    expect(ViewProvider.viewType).toBe('workspaceManager.workspacesView');
  });

  it('does nothing on refresh before the view is resolved', () => {
    const { provider, view } = setup();

    expect(() => provider.refresh()).not.toThrow();
    expect(view.webview.postMessage).not.toHaveBeenCalled();
  });

  it('configures the webview and posts the initial payload', () => {
    const { resolve, view, extensionUri } = setup();

    resolve();

    expect(view.webview.options).toEqual({
      enableScripts: true,
      localResourceRoots: [extensionUri],
    });
    expect(view.webview.html).toContain('class WorkspacesViewController');
    expect(view.webview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'updateWorkspaces',
        workspaces: [expect.objectContaining({ id: 'a' })],
      }),
    );
  });

  it('routes webview messages to the handler', async () => {
    const { resolve, messages, saveService } = setup();
    resolve();

    messages.fire({ command: 'saveCurrent' });
    await flush();

    expect(saveService.save).toHaveBeenCalledOnce();
  });

  it('posts a filtered payload after a search message', async () => {
    const { resolve, messages, view } = setup();
    resolve();
    view.webview.postMessage.mockClear();

    messages.fire({ command: 'search', query: 'nothing-matches' });
    await flush();

    expect(view.webview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ workspaces: [] }),
    );
  });

  it('refreshes when the view becomes visible', () => {
    const { resolve, visibility, view } = setup();
    resolve();
    view.webview.postMessage.mockClear();

    view.visible = false;
    visibility.fire();
    expect(view.webview.postMessage).not.toHaveBeenCalled();

    view.visible = true;
    visibility.fire();
    expect(view.webview.postMessage).toHaveBeenCalledOnce();
  });

  it('refreshes when the repository changes', async () => {
    const { resolve, repository, view } = setup();
    resolve();
    view.webview.postMessage.mockClear();

    await repository.save(buildWorkspace({ id: 'b' }));

    expect(view.webview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaces: expect.arrayContaining([
          expect.objectContaining({ id: 'b' }),
        ]),
      }),
    );
  });
});
