import { describe, expect, it, vi } from 'vitest';
import { ViewProvider } from './ViewProvider';

vi.mock('vscode', () => ({
  Uri: {
    file: (fsPath: string) => ({ fsPath, scheme: 'file' }),
  },
}));

describe('ViewProvider localResourceRoots', () => {
  it('builds a stable icon cache root identity across refreshes', () => {
    const extensionUri = { fsPath: '/ext', scheme: 'file' } as never;
    const cacheDir = '/tmp/webview-icons';

    const first = ViewProvider.buildLocalResourceRoots(extensionUri, cacheDir);
    const second = ViewProvider.buildLocalResourceRoots(extensionUri, cacheDir);

    expect(first).toHaveLength(2);
    expect(first[0]).toBe(extensionUri);
    expect(first[1].fsPath).toBe(cacheDir);
    expect(second[1].fsPath).toBe(first[1].fsPath);
    expect(JSON.stringify(first.map((uri) => uri.fsPath))).toBe(
      JSON.stringify(second.map((uri) => uri.fsPath)),
    );
  });

  it('keeps the same roots instance for the provider lifetime', () => {
    const extensionUri = { fsPath: '/ext', scheme: 'file' } as never;
    const repository = {
      onDidChange: vi.fn(),
      findAll: (): never[] => [],
      findOne: (): undefined => undefined,
    };
    const settings = {
      get: vi.fn((_key: string, fallback: unknown): unknown => fallback),
      detectsIcons: (): boolean => false,
    };
    const provider = new ViewProvider(
      extensionUri,
      repository as never,
      {} as never,
      {} as never,
      {} as never,
      { search: (): never[] => [] } as never,
      {} as never,
      settings as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        resolve: (): undefined => undefined,
        warm: (): void => undefined,
      } as never,
      '/tmp/stable-webview-icons',
    );

    const first = provider.getLocalResourceRoots();
    const second = provider.getLocalResourceRoots();
    expect(first).toBe(second);
    expect(first[1].fsPath).toBe('/tmp/stable-webview-icons');
    expect(provider.areWebviewOptionsLocked()).toBe(false);
  });
});
