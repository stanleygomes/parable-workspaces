import { SettingsStateManager } from '../../infra/persistence/SettingsStateManager';
import { SettingsKey } from '../enums/SettingsKey';
import { SortType } from '../enums/SortType';
import { WorkspaceQuery } from '../../infra/view/provider/WorkspaceQuery';

export class UpdateViewFilterService {
  constructor(
    private readonly workspaceQuery: WorkspaceQuery,
    private readonly settingsStateManager: SettingsStateManager,
  ) {}

  public async toggleFavoritesFilter(value: boolean): Promise<void> {
    this.workspaceQuery.showOnlyFavorites = value;
    await this.settingsStateManager.set(SettingsKey.ShowOnlyFavorites, value);
  }

  public async toggleFilters(value: boolean): Promise<void> {
    this.workspaceQuery.showFilters = value;
    await this.settingsStateManager.set(SettingsKey.ShowFilters, value);
  }

  public async changeSort(sortType: SortType): Promise<void> {
    this.workspaceQuery.currentSort = sortType;
    await this.settingsStateManager.set(SettingsKey.SortType, sortType);
  }
}
