import { SettingsStateManager } from '../../infra/persistence/SettingsStateManager';
import { SettingsKey } from '../enums/SettingsKey';
import { SortType } from '../enums/SortType';
import { ViewState } from '../../infra/view/provider/ViewState';

export class UpdateViewFilterService {
  constructor(
    private readonly ViewState: ViewState,
    private readonly settingsStateManager: SettingsStateManager,
  ) {}

  public async toggleFavoritesFilter(value: boolean): Promise<void> {
    this.ViewState.showOnlyFavorites = value;
    await this.settingsStateManager.set(SettingsKey.ShowOnlyFavorites, value);
  }

  public async toggleFilters(value: boolean): Promise<void> {
    this.ViewState.showFilters = value;
    await this.settingsStateManager.set(SettingsKey.ShowFilters, value);
  }

  public async changeSort(sortType: SortType): Promise<void> {
    this.ViewState.currentSort = sortType;
    await this.settingsStateManager.set(SettingsKey.SortType, sortType);
  }
}
