import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

vi.mock('vscode', () => ({
  workspace: {
    workspaceFolders: undefined,
    workspaceFile: undefined,
  },
  window: {
    activeTextEditor: undefined,
  },
  Uri: {
    file: (value: string) => ({ fsPath: value }),
  },
  ThemeIcon: class {
    constructor(public readonly id: string) {}
  },
}));

import { SettingsKey } from '../../core/enums/SettingsKey';
import { SortType } from '../../core/enums/SortType';
import { SwitchWorkspaceService } from '../../core/services/SwitchWorkspaceService';
import { UpdateViewFilterService } from '../../core/services/UpdateViewFilterService';
import { ViewState } from './ViewState';

describe('Icons filter chip', () => {
  const settings = {
    get: vi.fn(),
    set: vi.fn(async (): Promise<void> => undefined),
    detectsIcons: vi.fn((): boolean => false),
  };

  const iconCache = {
    resolve: vi.fn((): undefined => undefined),
    warm: vi.fn((): void => undefined),
  };

  let viewState: ViewState;
  let service: UpdateViewFilterService;

  beforeEach(() => {
    settings.get.mockImplementation((_key: SettingsKey, fallback: unknown) => {
      return fallback;
    });
    settings.set.mockClear();
    settings.detectsIcons.mockReturnValue(false);
    iconCache.resolve.mockReturnValue(undefined);

    viewState = new ViewState(
      {
        findOne: (): undefined => undefined,
        findAll: (): never[] => [],
      } as never,
      { search: (): never[] => [] } as never,
      {
        sort: (workspaces: unknown[]): unknown[] => workspaces,
      } as never,
      settings as never,
      iconCache as never,
    );
    service = new UpdateViewFilterService(viewState, settings as never);
  });

  it('defaults showFavicon to true and includes it in the payload filters', () => {
    expect(viewState.showFavicon).toBe(true);
    expect(viewState.getPayload().filters).toEqual({
      showOnlyFavorites: false,
      sortType: SortType.FavoritesFirst,
      showFilters: false,
      showTimeUpdated: false,
      showFavicon: true,
      detectIcons: false,
    });
  });

  it('persists the Icons toggle through SettingsKey.ShowFavicon', async () => {
    await service.toggleShowFavicon(false);

    expect(viewState.showFavicon).toBe(false);
    expect(settings.set).toHaveBeenCalledWith(SettingsKey.ShowFavicon, false);
    expect(viewState.getPayload().filters.showFavicon).toBe(false);
  });

  it('renders the Icons chip beside Updated', () => {
    const filtersHtml = readFileSync(
      join(__dirname, './html/filters.html'),
      'utf8',
    );
    const controller = readFileSync(
      join(__dirname, './js/controller.js'),
      'utf8',
    );
    const renderer = readFileSync(join(__dirname, './js/renderer.js'), 'utf8');

    expect(filtersHtml).toContain('id="btnShowFavicon"');
    expect(filtersHtml).toContain('filter-chip-label">Icons');
    expect(controller).toContain('toggleShowFavicon');
    expect(renderer).toContain('filters?.showFavicon !== false');
    expect(renderer).toContain('no-icons');
  });

  it('omits QuickPick emoji and iconPath when showFavicon is false', async () => {
    settings.get.mockImplementation((key: SettingsKey, fallback: unknown) => {
      if (key === SettingsKey.ShowFavicon) {
        return false;
      }
      return fallback;
    });

    const showQuickPick = vi.fn(async (): Promise<undefined> => undefined);
    const switchService = new SwitchWorkspaceService(
      {
        findAll: () => [
          {
            id: 'a',
            name: 'Alpha',
            emoji: '🚀',
            folders: ['/tmp/a'],
            tags: [] as string[],
            lastOpened: 2,
          },
        ],
      } as never,
      { open: vi.fn(async (): Promise<void> => undefined) } as never,
      {
        showInfo: vi.fn(),
        executeCommand: vi.fn(),
        showQuickPick,
      } as never,
      iconCache as never,
      settings as never,
      '/tmp/quickpick-icons',
    );

    await switchService.switch();

    expect(showQuickPick).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: 'a',
          label: 'Alpha',
        }),
      ],
      expect.any(Object),
    );
    expect(iconCache.resolve).not.toHaveBeenCalled();
  });

  it('includes QuickPick emoji icons when showFavicon is true', async () => {
    const showQuickPick = vi.fn(async (): Promise<undefined> => undefined);
    const switchService = new SwitchWorkspaceService(
      {
        findAll: () => [
          {
            id: 'a',
            name: 'Alpha',
            emoji: '🚀',
            folders: ['/tmp/a'],
            tags: [] as string[],
            lastOpened: 2,
          },
        ],
      } as never,
      { open: vi.fn(async (): Promise<void> => undefined) } as never,
      {
        showInfo: vi.fn(),
        executeCommand: vi.fn(),
        showQuickPick,
      } as never,
      iconCache as never,
      settings as never,
      '/tmp/quickpick-icons',
    );

    await switchService.switch();

    expect(showQuickPick).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: 'a',
          label: '🚀 Alpha',
        }),
      ],
      expect.any(Object),
    );
  });
});
