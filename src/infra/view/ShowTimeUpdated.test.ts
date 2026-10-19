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
}));

import { SettingsKey } from '../../core/enums/SettingsKey';
import { SortType } from '../../core/enums/SortType';
import { UpdateViewFilterService } from '../../core/services/UpdateViewFilterService';
import { ViewState } from './ViewState';

describe('Updated filter chip', () => {
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

  it('defaults showTimeUpdated to false and includes it in the payload filters', () => {
    expect(viewState.showTimeUpdated).toBe(false);
    expect(viewState.getPayload().filters).toEqual({
      showOnlyFavorites: false,
      sortType: SortType.FavoritesFirst,
      showFilters: false,
      showTimeUpdated: false,
      showFavicon: true,
      detectIcons: false,
    });
  });

  it('persists the Updated toggle through SettingsKey.ShowTimeUpdated', async () => {
    await service.toggleTimeUpdated(true);

    expect(viewState.showTimeUpdated).toBe(true);
    expect(settings.set).toHaveBeenCalledWith(
      SettingsKey.ShowTimeUpdated,
      true,
    );
    expect(viewState.getPayload().filters.showTimeUpdated).toBe(true);
  });

  it('renders Favorites and Updated chips with compact label spans', () => {
    const filtersHtml = readFileSync(
      join(__dirname, './html/filters.html'),
      'utf8',
    );
    const css = readFileSync(join(__dirname, './css/main.css'), 'utf8');
    const controller = readFileSync(
      join(__dirname, './js/controller.js'),
      'utf8',
    );

    expect(filtersHtml).toContain('id="btnShowTimeUpdated"');
    expect(filtersHtml).toContain('filter-chip-label">Favorites');
    expect(filtersHtml).toContain('filter-chip-label">Updated');
    expect(css).toContain('.filter-row.compact .filter-chip-label');
    expect(controller).toContain('ResizeObserver');
    expect(controller).toContain('updateFilterCompactMode');
    expect(controller).toContain('toggleTimeUpdated');
  });

  it('gates the workspace date label on showTimeUpdated in the renderer', () => {
    const renderer = readFileSync(
      join(__dirname, './js/renderer.js'),
      'utf8',
    );

    expect(renderer).toContain('filters?.showTimeUpdated === true');
    expect(renderer).toContain('workspace-date');
  });
});
