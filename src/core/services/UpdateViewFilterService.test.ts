import { describe, expect, it, vi } from 'vitest';
import { SettingsKey } from '../enums/SettingsKey';
import { SortType } from '../enums/SortType';
import type { SettingsStateManager } from '../../infra/persistence/SettingsStateManager';
import type { ViewState } from '../../infra/view/ViewState';
import { UpdateViewFilterService } from './UpdateViewFilterService';

function setup() {
  const viewState = {
    showOnlyFavorites: false,
    showFilters: false,
    currentSort: SortType.FavoritesFirst,
  };
  const settings = { set: vi.fn() };
  const service = new UpdateViewFilterService(
    viewState as unknown as ViewState,
    settings as unknown as SettingsStateManager,
  );
  return { service, viewState, settings };
}

describe('UpdateViewFilterService', () => {
  it('toggles the favorites filter and persists it', async () => {
    const { service, viewState, settings } = setup();

    await service.toggleFavoritesFilter(true);

    expect(viewState.showOnlyFavorites).toBe(true);
    expect(settings.set).toHaveBeenCalledWith(
      SettingsKey.ShowOnlyFavorites,
      true,
    );
  });

  it('toggles the filters panel and persists it', async () => {
    const { service, viewState, settings } = setup();

    await service.toggleFilters(true);

    expect(viewState.showFilters).toBe(true);
    expect(settings.set).toHaveBeenCalledWith(SettingsKey.ShowFilters, true);
  });

  it('changes the sort type and persists it', async () => {
    const { service, viewState, settings } = setup();

    await service.changeSort(SortType.Alphabetical);

    expect(viewState.currentSort).toBe(SortType.Alphabetical);
    expect(settings.set).toHaveBeenCalledWith(
      SettingsKey.SortType,
      SortType.Alphabetical,
    );
  });
});
